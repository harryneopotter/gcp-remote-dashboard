const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcrypt');

// --- REMOTE COMMAND WRAPPER: ALWAYS USE TAILSCALE SSH TO GCP VM ---
const wrapCommand = (cmd) => (
  `tailscale ssh ${process.env.TAILSCALE_SSH_USER}@${process.env.TAILSCALE_SSH_HOST} '${cmd.replace(/'/g, "'\''")}'`
);

const app = express();
const PORT = process.env.PORT || 3334;

// --- USER CREDENTIALS ---
const user = {
  username: process.env.ADMIN_USERNAME || 'admin',
  passwordHash: process.env.ADMIN_PASSWORD_HASH || ''
};

const ALLOWED_SERVICES = ['sd-forge', 'filebrowser'];

app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-in-prod',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (username === user.username) {
    const match = await bcrypt.compare(password, user.passwordHash);
    if (match) {
      req.session.user = { username: user.username };
      return res.status(200).json({ message: 'Login successful.' });
    }
  }
  res.status(401).json({ message: 'Invalid username or password.' });
});

const checkAuth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    res.redirect('/login.html');
  }
};
app.use(checkAuth);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: 'Could not log out, please try again.' });
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logout successful.' });
  });
});

app.get('/api/status/gpu', (req, res) => {
  const command = wrapCommand('/usr/bin/nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu --format=csv,noheader,nounits');
  exec(command, (error, stdout, stderr) => {
    if (error) return res.status(500).json({ error: 'Failed to execute nvidia-smi', details: stderr });
    const [utilization, memoryUsed, memoryTotal, temperature] = stdout.trim().split(', ');
    res.json({ utilization: parseInt(utilization, 10) || 0, memory: { used: parseInt(memoryUsed, 10) || 0, total: parseInt(memoryTotal, 10) || 0 }, temperature: parseInt(temperature, 10) || 0 });
  });
});

app.get('/api/status/storage', (req, res) => {
  const dataPath = '/mnt/data';
  const command = wrapCommand(`sudo /usr/bin/du -sh ${dataPath}`);
  exec(command, (error, stdout, stderr) => {
    if (error) return res.status(500).json({ error: 'Failed to execute du', details: stderr });
    const size = stdout.trim().split('\t')[0];
    res.json({ path: dataPath, usage: size });
  });
});

app.get('/api/status/ram', (req, res) => {
  const command = wrapCommand('free -m');
  exec(command, (error, stdout, stderr) => {
    if (error) return res.status(500).json({ error: 'Failed to execute free', details: stderr });
    const lines = stdout.split('\n');
    const memLine = lines[1].split(/\s+/);
    res.json({ total: parseInt(memLine[1], 10), used: parseInt(memLine[2], 10), free: parseInt(memLine[3], 10) });
  });
});

app.get('/api/status/cpu', (req, res) => {
  const command = wrapCommand('cat /proc/loadavg');
  exec(command, (error, stdout, stderr) => {
    if (error || !stdout) return res.status(500).json({ error: 'Failed to read /proc/loadavg', details: stderr || stdout });
    const [oneMin, fiveMin, fifteenMin] = stdout.trim().split(/\s+/);
    res.json({
      load_average: {
        one_minute: parseFloat(oneMin),
        five_minute: parseFloat(fiveMin),
        fifteen_minute: parseFloat(fifteenMin)
      },
      raw: stdout.trim()
    });
  });
});

app.get('/api/status/profiles', (req, res) => {
  const command = wrapCommand('docker ps --format "{{json .}}"');
  exec(command, (error, stdout, stderr) => {
    if (error) return res.status(500).json({ error: 'Failed to execute docker ps', details: stderr });
    res.json({ runningContainers: stdout.trim() ? stdout.trim().split('\n').map(line => JSON.parse(line)) : [] });
  });
});

app.get('/api/logs/:serviceName', (req, res) => {
  const serviceName = req.params.serviceName;
  if (!ALLOWED_SERVICES.includes(serviceName)) return res.status(400).json({ error: 'Invalid service name provided.' });
  const dockerPsCmd = wrapCommand('docker ps --format "{{.Names}}"');
  exec(dockerPsCmd, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: `Failed to list running containers`, details: stderr });
    const candidates = stdout.trim().split('\n').filter(Boolean);
    const foundName = candidates.find(name => name === serviceName || name.includes(serviceName));
    if (!foundName) return res.status(404).json({ error: `Container for service '${serviceName}' not found or not running.`, debug: candidates });
    const logCmd = wrapCommand(`docker logs --tail 100 ${foundName}`);
    exec(logCmd, (logErr, logs, logStderr) => {
      if (logErr) return res.status(500).json({ error: `Failed to get logs for '${serviceName}'`, details: logStderr });
      res.json({ logs: logs });
    });
  });
});

app.post('/api/action/start/:serviceName', (req, res) => {
  const serviceName = req.params.serviceName;
  if (!ALLOWED_SERVICES.includes(serviceName)) return res.status(400).json({ error: 'Invalid service name.' });
  const command = wrapCommand(`docker start ${serviceName}`);
  exec(command, (error, stdout, stderr) => {
    if (error) return res.status(500).json({ error: `Failed to start ${serviceName}`, details: stderr });
    res.json({ message: `${serviceName} started successfully.`, details: stdout });
  });
});

app.post('/api/action/stop/:serviceName', (req, res) => {
  const serviceName = req.params.serviceName;
  if (!ALLOWED_SERVICES.includes(serviceName)) return res.status(400).json({ error: 'Invalid service name.' });
  const command = wrapCommand(`docker stop ${serviceName}`);
  exec(command, (error, stdout, stderr) => {
    if (error) return res.status(500).json({ error: `Failed to stop ${serviceName}`, details: stderr });
    res.json({ message: `${serviceName} stopped successfully.`, details: stdout });
  });
});

app.post('/api/logs/clear/:serviceName', (req, res) => {
  const name = req.params.serviceName;
  if (!ALLOWED_SERVICES.includes(name)) return res.status(400).json({ error: 'Invalid service name.' });
  const getLogPathCmd = wrapCommand(`docker inspect --format='{{.LogPath}}' ${name}`);
  exec(getLogPathCmd, (err, logPath, stderr) => {
    if (err || !logPath.trim()) return res.status(500).json({ error: 'Failed to get log path', details: stderr });
    const truncateCmd = wrapCommand(`sudo truncate -s 0 "${logPath.trim()}"`);
    exec(truncateCmd, (truncErr, stdout, truncStderr) => {
      if (truncErr) return res.status(500).json({ error: 'Failed to clear logs', details: truncStderr });
      res.json({ message: `Logs for '${name}' cleared.` });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Dashboard server running on http://localhost:${PORT}`);
});
