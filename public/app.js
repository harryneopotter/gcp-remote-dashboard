// public/app.js - Full upgraded version

let currentStatus = { 'sd-forge': true, 'filebrowser': true };

document.addEventListener('DOMContentLoaded', () => {
  updateLiveStats();
  setInterval(updateLiveStats, 4000);
  checkContainerStatus();
});

async function updateLiveStats() {
  try {
    const [cpuRes, gpuRes, ramRes, storageRes] = await Promise.all([
      fetch('/api/status/cpu'),
      fetch('/api/status/gpu'),
      fetch('/api/status/ram'),
      fetch('/api/status/storage')
    ]);

    const cpu = await cpuRes.json();
    const gpu = await gpuRes.json();
    const ram = await ramRes.json();
    const storage = await storageRes.json();

    document.getElementById('cpu-val').textContent = Math.round(cpu.load_average.one_minute * 100);
    document.getElementById('gpu-val').textContent = gpu.utilization || 0;
    document.getElementById('ram-val').textContent = (ram.used / 1024).toFixed(1);
    document.getElementById('storage-val').textContent = storage.usage.replace('G', '');
  } catch (e) {}
}

async function checkContainerStatus() {
  // For now we assume running. You can expand this later with docker ps
  updatePosterStatus('sd-forge', true);
  updatePosterStatus('filebrowser', true);
}

function updatePosterStatus(service, isRunning) {
  const poster = document.getElementById(`poster-${service}`);
  const statusEl = document.getElementById(`status-${service}`);
  
  if (isRunning) {
    poster.classList.add('running');
    poster.classList.remove('stopped');
    statusEl.innerHTML = '● Running';
    statusEl.className = 'text-emerald-400 text-sm font-medium';
  } else {
    poster.classList.add('stopped');
    poster.classList.remove('running');
    statusEl.innerHTML = '● Stopped';
    statusEl.className = 'text-red-400 text-sm font-medium';
  }
  currentStatus[service] = isRunning;
}

async function toggleContainer(service) {
  const isRunning = currentStatus[service];
  const action = isRunning ? 'stop' : 'start';
  
  const poster = document.getElementById(`poster-${service}`);
  poster.style.pointerEvents = 'none';
  
  try {
    const res = await fetch(`/api/action/${action}/${service}`, { method: 'POST' });
    const data = await res.json();
    
    const newState = !isRunning;
    updatePosterStatus(service, newState);
    
    const logEl = document.getElementById('log-output');
    logEl.textContent = `${service} ${action}ed successfully.\n${data.message || ''}`;
    
    setTimeout(() => {
      if (logEl.textContent.includes('successfully')) logEl.textContent = '';
    }, 2500);
  } catch (err) {
    document.getElementById('log-output').textContent = `Error: ${err.message}`;
  } finally {
    poster.style.pointerEvents = 'all';
  }
}

async function fetchLogs(service) {
  const logEl = document.getElementById('log-output');
  logEl.textContent = `Fetching logs for ${service}...`;
  
  try {
    const res = await fetch(`/api/logs/${service}`);
    const data = await res.json();
    logEl.textContent = data.logs || 'No logs returned.';
  } catch (e) {
    logEl.textContent = 'Failed to fetch logs.';
  }
}

async function clearLogsWithSword(service) {
  const logEl = document.getElementById('log-output');
  const container = document.getElementById(`poster-${service}`);
  
  // Create sword slash effect
  const slash = document.createElement('div');
  slash.className = 'sword-swipe';
  container.appendChild(slash);
  
  setTimeout(() => slash.remove(), 700);
  
  logEl.textContent = 'Zoro is clearing the logs... ⚔️';
  
  try {
    await fetch(`/api/logs/clear/${service}`, { method: 'POST' });
    logEl.textContent = `Logs for ${service} cleared by Zoro!`;
    setTimeout(() => logEl.textContent = '', 2200);
  } catch (e) {
    logEl.textContent = 'Failed to clear logs.';
  }
}

function clearAllLogs() {
  document.getElementById('log-output').textContent = '';
}

function logout() {
  fetch('/logout', { method: 'POST' }).then(() => window.location.href = '/login.html');
}
