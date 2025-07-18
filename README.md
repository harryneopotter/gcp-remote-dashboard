# Remote Docker Dashboard (via Tailscale SSH)

A Node.js dashboard for **securely managing Docker containers on a remote (e.g., GCP) VM** using Tailscale SSH.

## Features
- Start, stop, view logs, and clear logs for selected Docker containers
- All actions happen *remotely* via Tailscale SSH — nothing runs locally except the dashboard
- Secure session authentication

## Setup

### Prerequisites
- Node.js (v16+)
- Docker on the remote VM (GCP)
- Tailscale on both dashboard and remote VM (SSH enabled)

### Environment Variables

Create a `.env` (not included in git) with these:

```
ADMIN_USERNAME=youradmin
ADMIN_PASSWORD_HASH=your_bcrypt_hash
SESSION_SECRET=super-secret-string
TAILSCALE_SSH_USER=your_gcp_vm_ssh_user
TAILSCALE_SSH_HOST=your_gcp_vm_hostname_or_ip
PORT=3334
```

### Usage
- Install dependencies: `npm install`
- Start server: `node server.js` (or use pm2/systemd)
- Open your browser to `http://<your-azure-vm>:3334/`

**All Docker commands are executed remotely over Tailscale SSH.**

## Security Notes
- Never check your `.env` or secrets into git!
- Always use a strong session secret and password hash.
- Tailscale SSH must be configured for non-interactive use (no password prompts).

---