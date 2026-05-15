# Local VPS Monitor

Local VPS Monitor is a local-first npm tool for monitoring applications across VPS machines and local Docker containers from one screen.

It is built for developers who run apps with Docker or PM2 and want a quick way to check whether servers and apps are healthy without manually SSH-ing into each VPS.

## What It Does

- Monitors multiple VPS machines through outbound SSH from your local computer.
- Scans Docker containers and PM2 processes on remote VPS targets.
- Scans Docker containers running on your local machine.
- Shows server health, app status, CPU, memory, ports, image names, and restart information.
- Shows lightweight CPU and RAM charts from local scan history.
- Shows an incident notification drawer for app status changes and restarts.
- Runs allowlisted quick actions such as app restarts and basic VPS checks.
- Updates the dashboard through WebSocket after scans.
- Runs automatic scans through `AUTO_SCAN_INTERVAL_MS`.
- Stores monitor data locally under `data/`.

## Security Model

- The API binds to `127.0.0.1` by default.
- The API and WebSocket reject non-local `Host` and `Origin` headers.
- No SSH password is requested or stored.
- SSH private key content is not persisted; only the local key file path is stored.
- SSH host keys are verified through your local `known_hosts` file.
- Quick actions use predefined commands only; there is no free-form remote shell.
- There is no remote agent mode and no public ingest endpoint.

## Requirements

- Node.js 20+
- npm
- OpenSSH Client in your terminal: `ssh`, `ssh-keygen`, and `ssh-keyscan`
- SSH access to your VPS machines
- Docker Desktop or Docker Engine, only if you want Local Docker scanning

## Local Setup

Run it directly on your machine with Node.js. No app container or Docker deployment is required.

### Windows PowerShell

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

### macOS or Linux

```bash
npm install
cp .env.example .env
npm run dev
```

Dashboard:

```text
http://127.0.0.1:5173
```

API:

```text
http://127.0.0.1:3101
```

## SSH Target Setup

The dashboard connects to each VPS through a local SSH private key. Create the monitor key once on your computer, then copy the same public key to every VPS you want to monitor.

Do not paste key content into the dashboard; paste the private key file path.

### Windows PowerShell

Create the monitor SSH key once:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.ssh" | Out-Null

if (Test-Path "$env:USERPROFILE\.ssh\vps_monitor") {
  Write-Host "Using existing monitor key: $env:USERPROFILE\.ssh\vps_monitor"
} else {
  ssh-keygen -t ed25519 -f "$env:USERPROFILE\.ssh\vps_monitor"
}
```

If `ssh-keygen` asks for a passphrase, press Enter twice to leave it empty.

Repeat the next commands for each VPS. Before running them, replace:

- `root`: your VPS SSH user, for example `root`, `ubuntu`, or `debian`
- `your-vps-ip`: your VPS IP address or domain, for example `203.0.113.10`
- `22`: your VPS SSH port, if it is not the default port

For example, `root@your-vps-ip` becomes `root@203.0.113.10`.

Copy the public key to one VPS:

```powershell
Get-Content "$env:USERPROFILE\.ssh\vps_monitor.pub" | ssh root@your-vps-ip "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
```

Trust the VPS host key:

```powershell
ssh-keyscan -p 22 your-vps-ip | Out-File -FilePath "$env:USERPROFILE\.ssh\known_hosts" -Append -Encoding ascii
```

Test the SSH key:

```powershell
ssh -i "$env:USERPROFILE\.ssh\vps_monitor" root@your-vps-ip "echo ok"
```

Then open the dashboard and add one target for that VPS with:

- Name: any label, for example `Production VPS`
- Host: your VPS IP or domain
- Port: usually `22`
- SSH user: for example `root`
- Private key path: `C:\Users\your-name\.ssh\vps_monitor`, replace `your-name` with your Windows username

### macOS or Linux

Create the monitor SSH key once:

```bash
mkdir -p ~/.ssh

if [ -f ~/.ssh/vps_monitor ]; then
  echo "Using existing monitor key: ~/.ssh/vps_monitor"
else
  ssh-keygen -t ed25519 -f ~/.ssh/vps_monitor
fi
```

If `ssh-keygen` asks for a passphrase, press Enter twice to leave it empty.

Repeat the next commands for each VPS. Before running them, replace:

- `root`: your VPS SSH user, for example `root`, `ubuntu`, or `debian`
- `your-vps-ip`: your VPS IP address or domain, for example `203.0.113.10`
- `22`: your VPS SSH port, if it is not the default port

For example, `root@your-vps-ip` becomes `root@203.0.113.10`.

Copy the public key to one VPS:

```bash
ssh-copy-id -i ~/.ssh/vps_monitor.pub root@your-vps-ip
```

Trust the VPS host key:

```bash
ssh-keyscan -p 22 your-vps-ip >> ~/.ssh/known_hosts
```

Test the SSH key:

```bash
ssh -i ~/.ssh/vps_monitor root@your-vps-ip "echo ok"
```

Then open the dashboard and add one target for that VPS with:

- Name: any label, for example `Production VPS`
- Host: your VPS IP or domain
- Port: usually `22`
- SSH user: for example `root`
- Private key path: `~/.ssh/vps_monitor`

To add more VPS machines, repeat the copy, trust, test, and dashboard target steps for each VPS. Keep the same private key path for all targets unless you intentionally created separate keys.

Click `Scan`, `Scan All`, or wait for automatic scans.

## Local Docker Setup

Make sure Docker is running and the `docker` CLI works in your terminal:

```bash
docker ps
```

Then click `Scan Docker` in the dashboard, or wait for the automatic scan loop.

## Reset Local Data

```bash
npm run reset:data
```

This resets the monitor state file. SSH targets are stored separately in `SSH_TARGETS_FILE`.

## Build

```bash
npm run build
npm start
```

## Environment Variables

- `HOST`: API bind host. Defaults to `127.0.0.1`.
- `PORT`: API port. Defaults to `3101`.
- `DATA_FILE`: local monitor state file. Defaults to `./data/monitor-state.json`.
- `SSH_TARGETS_FILE`: local SSH target config file. Defaults to `./data/ssh-targets.json`.
- `SSH_COMMAND_TIMEOUT_MS`: SSH connect and command timeout. Defaults to `12000`.
- `LOCAL_DOCKER_COMMAND_TIMEOUT_MS`: local Docker command timeout. Defaults to `12000`.
- `OFFLINE_AFTER_MS`: timeout before a server is marked offline.
- `REALTIME_BROADCAST_MS`: interval for periodic WebSocket overview broadcasts.
- `AUTO_SCAN_INTERVAL_MS`: interval for automatic SSH and Local Docker scans. Set to `0` to disable.
- `SSH_SCAN_CONCURRENCY`: maximum SSH scans running at the same time. Defaults to `4`.
