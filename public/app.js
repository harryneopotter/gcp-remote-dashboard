// public/app.js
document.addEventListener('DOMContentLoaded', () => {
  const btnLogsSdForge = document.getElementById('btn-logs-sd-forge');
  if (btnLogsSdForge) btnLogsSdForge.addEventListener('click', () => handleFetchLogs('sd-forge'));

  const btnLogsFilebrowser = document.getElementById('btn-logs-filebrowser');
  if (btnLogsFilebrowser) btnLogsFilebrowser.addEventListener('click', () => handleFetchLogs('filebrowser'));

  const btnClearLogsSdForge = document.getElementById('btn-clear-logs-sd-forge');
  if (btnClearLogsSdForge) btnClearLogsSdForge.addEventListener('click', () => clearLogs('sd-forge'));

  const btnClearLogsFilebrowser = document.getElementById('btn-clear-logs-filebrowser');
  if (btnClearLogsFilebrowser) btnClearLogsFilebrowser.addEventListener('click', () => clearLogs('filebrowser'));
});

async function handleFetchLogs(serviceName) {
  const logOutputEl = document.getElementById('log-output');
  logOutputEl.textContent = `Fetching logs for ${serviceName}...`;
  try {
    const response = await fetch(`/api/logs/${serviceName}`);
    const data = await response.json();
    if (response.ok) {
      logOutputEl.textContent = data.logs || 'No logs returned.';
    } else {
      logOutputEl.textContent = `Error fetching logs: ${data.error}\n\nDetails: ${data.details}`;
    }
  } catch (error) {
    logOutputEl.textContent = `An unexpected error occurred. See browser console.`;
  }
}

function clearLogs(serviceName) {
  fetch(`/api/logs/clear/${serviceName}`, { method: 'POST' })
    .then(res => res.json())
    .then(data => {
      document.getElementById('log-output').textContent = '';
    })
    .catch(err => {
      document.getElementById('log-output').textContent = 'Error clearing logs: ' + err.message;
    });
}