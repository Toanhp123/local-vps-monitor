# Local VPS Monitor

Local VPS Monitor is a local-first npm tool for monitoring applications across VPS machines and local Docker containers from one screen.

It is built for developers who run apps with Docker or PM2 and want a quick way to check whether servers and apps are healthy without manually SSH-ing into each VPS.

## What It Does

- Monitors multiple VPS machines through outbound SSH from your local computer.
- Scans Docker containers and PM2 processes on remote VPS targets.
- Scans Docker containers running on your local machine.
- Shows server health, app status, CPU, memory, ports, image names, and restart information.
- Shows lightweight CPU, RAM, and disk charts from local scan history.
- Shows an incident notification drawer for app status changes and restarts.
- Persists incident state locally.
- Raises disk, memory, and CPU load incidents when a server crosses warning or critical thresholds.
- Lets you tune default and per-server resource warning and critical thresholds from Settings.
- Lets you tune scan intervals, timeouts, concurrency, retention limits, log defaults, and offline detection from Settings.
- Runs HTTP health checks against app or server URLs and records latency, status codes, and failures.
- Lets you mark apps as critical, normal, or ignored so low-value processes do not pollute health.
- Runs allowlisted quick actions such as app restarts and basic VPS checks.
- Updates the dashboard through WebSocket after scans.
- Runs automatic scans on the interval configured in Settings.
- Stores monitor data locally under `data/`.

## Security Model

- The API binds to `127.0.0.1` by default.
- The API and WebSocket reject non-local `Host` and `Origin` headers.
- SSH passwords can be used once to install the monitor key, but they are not stored.
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

```bash
npm install
npm start
```

On first start, the app creates `.env` from `.env.example` if it does not exist, builds the dashboard if needed, then starts the local server.

Dashboard:

```text
http://127.0.0.1:3101
```

API:

```text
http://127.0.0.1:3101/api
```

For development with live reload:

```bash
npm run dev
```

When using `npm run dev`, the dashboard defaults to `http://127.0.0.1:5173`. To use a different dev dashboard port, edit `DASHBOARD_PORT` in `.env`.

## SSH Target Setup

The dashboard connects to each VPS through SSH key auth. You can let the app set up the key for you, or create and copy the key yourself.

### Option 1: Setup with Password

Use this if the VPS still allows SSH password login. Open the dashboard, go to `Local SSH Targets`, and add one target with:

- Name: any label, for example `Production VPS`
- Host: your VPS IP or domain, for example `203.0.113.10`
- Port: usually `22`
- User: your VPS SSH user, for example `root`, `ubuntu`, or `debian`
- Auth: `Password`
- Setup password: the SSH password for that VPS

The password is only used for this setup request. After the monitor key is installed, the app discards the password and never stores it. SSH target config is persisted in SQLite.

During setup, the app will:

- Create a local monitor key at `~/.ssh/vps_monitor` if it does not exist.
- Copy the monitor public key to the VPS `~/.ssh/authorized_keys`.
- Trust the VPS host key in your local `known_hosts` file.
- Test key-based login.
- Save the target with the local private key path.

### Option 2: Manual Key Setup

Use this if password login is disabled, or if you prefer to manage SSH keys yourself. Create the monitor key once on your computer, then copy the same public key to every VPS you want to monitor.

Before running the commands, replace:

- `root`: your VPS SSH user, for example `root`, `ubuntu`, or `debian`
- `your-vps-ip`: your VPS IP address or domain, for example `203.0.113.10`
- `22`: your VPS SSH port, if it is not the default port

#### Windows PowerShell

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

In the dashboard, add the target with `Auth` set to `Key path` and use:

```text
C:\Users\your-name\.ssh\vps_monitor
```

Replace `your-name` with your Windows username.

#### macOS or Linux

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

In the dashboard, add the target with `Auth` set to `Key path` and use:

```text
~/.ssh/vps_monitor
```

To add more VPS machines, repeat the password setup or manual copy/trust/test steps for each VPS. You can reuse the same private key path for all targets.

### Manage SSH Targets

In `Local SSH Targets`, use:

- `Test`: check SSH key login without scanning apps.
- `Edit`: update name, host, port, user, or private key path.
- `Bulk import`: add many VPS targets from pasted CSV rows.

Bulk import format:

```text
name,host,port,user,privateKeyPath
Production VPS,203.0.113.10,22,root,~/.ssh/vps_monitor
```

For password setup bulk import, switch bulk import Auth to `Password` and use:

```text
name,host,port,user,password
Production VPS,203.0.113.10,22,root,my-temporary-password
```

Passwords in bulk import are only used for the setup requests and are not stored.

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

This resets the monitor state file. SSH targets and other config documents are stored in SQLite.

## Manual Build

```bash
npm run build
npm start
```

## Environment Variables

- `HOST`: API bind host. Defaults to `127.0.0.1`.
- `PORT`: API port, and dashboard port when using `npm start`. Defaults to `3101`.
- `DASHBOARD_PORT`: dashboard dev server port for `npm run dev`. Defaults to `5173`.
- `DATABASE_FILE`: SQLite database file. Defaults to `./data/monitor.db`.
- `DATA_FILE`: local current monitor state file. Defaults to `./data/monitor-state.json`.
- `SSH_TARGETS_FILE`: legacy SSH target import file. Defaults to `./data/ssh-targets.json`.
- `HTTP_CHECKS_FILE`: legacy HTTP health check import file. Defaults to `./data/http-checks.json`.
- `APP_POLICIES_FILE`: legacy app policy import file. Defaults to `./data/app-policies.json`. Legacy `APP_MONITOR_RULES_FILE` is still accepted.
- `SERVER_ALERT_POLICY_FILE`: legacy server alert policy import file. Defaults to `./data/server-alert-policy.json`.
- `INCIDENT_STATE_FILE`: legacy incident state import file. Defaults to `./data/incident-state.json`.
- `MONITOR_RUNTIME_FILE`: legacy monitor runtime settings import file. Defaults to `./data/monitor-runtime.json`.

Runtime behavior such as scan interval, command timeouts, concurrency, offline detection, retention limits, and app log defaults is managed from Settings and persisted in SQLite.
