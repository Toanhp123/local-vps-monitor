# Local VPS Monitor

Local VPS Monitor is a local-first dashboard for monitoring applications across VPS machines and local Docker containers from one screen.

It is built for developers who deploy apps with Docker or PM2 and want a quick way to check whether servers and apps are healthy without manually SSH-ing into each VPS.

## What It Does

- Monitors multiple VPS machines through outbound SSH from your local computer.
- Scans Docker containers and PM2 processes on remote VPS targets.
- Scans Docker containers running on your local machine.
- Shows server health, app status, CPU, memory, ports, image names, and restart information.
- Shows lightweight CPU and RAM charts from local scan history.
- Updates the dashboard through WebSocket after scans.
- Runs automatic scans through `AUTO_SCAN_INTERVAL_MS`.
- Stores monitor data locally under `data/`.

## Security Model

- The API binds to `127.0.0.1` by default.
- The API and WebSocket reject non-local `Host` and `Origin` headers.
- No SSH password is requested or stored.
- SSH private key content is not persisted; only the local key file path is stored.
- SSH host keys are verified through your local `~/.ssh/known_hosts`.
- There is no remote agent mode and no public ingest endpoint.

## Requirements

- Node.js 20+
- npm
- SSH access to your VPS machines
- Docker Desktop or Docker Engine, only if you want Local Docker scanning

## Local Setup

```bash
npm install
copy .env.example .env
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

Create a monitor SSH key:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/vps_monitor
```

Copy the public key to your VPS:

```bash
ssh-copy-id -i ~/.ssh/vps_monitor.pub root@your-vps-ip
```

Trust the VPS host key:

```bash
ssh-keyscan -p 22 your-vps-ip >> ~/.ssh/known_hosts
```

Then open the dashboard and add a target with:

- Name
- Host
- Port
- SSH user
- Private key path

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
