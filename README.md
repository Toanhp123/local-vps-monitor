# VPS Monitor

VPS Monitor is a local-first dashboard for checking applications across multiple VPS machines from one screen. It is designed for developers who run apps with Docker and PM2 and do not want to SSH into every server manually.

The default mode is **Local SSH mode**:

- The dashboard and API run on `127.0.0.1`.
- The API and WebSocket reject non-local `Host` and `Origin` headers.
- The app opens outbound SSH connections from your own machine to your own VPS instances.
- SSH passwords are not stored or requested by the dashboard.
- SSH private key content is not persisted; only the local key file path is saved.
- SSH host keys are verified through your local `~/.ssh/known_hosts` file.
- Metrics are stored in local JSON files under `data/`, which is ignored by Git.
- There is no remote agent mode and no public ingest endpoint.

## Architecture

```text
Browser dashboard ---> Local Express API ---> SSH ---> VPS 1
                                      |-----> SSH ---> VPS 2
                                      |-----> SSH ---> VPS 3

Local Express API ---> WebSocket /ws ---> Browser dashboard
```

Main parts:

- `server`: Express API, MVC-style controllers/services/models, SSH scanner, JSON storage, and WebSocket broadcaster.
- `client`: React dashboard using a lightweight Feature-Sliced Design structure and Tailwind CSS.
- `storage`: local JSON files configured by `DATA_FILE` and `SSH_TARGETS_FILE`.

For a detailed Vietnamese explanation for CV/interview use, see `docs/project-explanation.md`.

## Server Structure

The API server uses a simple MVC-style structure because the backend has a small endpoint surface and limited CRUD complexity.

```text
src/server
|-- index.ts                 # server bootstrap
|-- app.ts                   # Express app composition
|-- config.ts                # environment configuration
|-- routes                   # HTTP route definitions
|-- controllers              # request/response handlers
|-- services                 # application use cases
|-- models                   # persistence/state model
|-- domain                   # pure monitor projection and status logic
|-- integrations             # external adapters such as SSH command runners and collectors
|-- lib                      # small backend utilities
|-- realtime                 # WebSocket gateway
`-- validators               # request payload schemas
```

## Client Structure

```text
src/client
|-- app                      # app bootstrap and global styles
|-- pages                    # route-level screens
|-- widgets                  # composed dashboard sections
|-- entities                 # domain UI for servers and applications
`-- shared                   # API clients, formatting helpers, reusable UI
```

## Local Development

```bash
npm install
copy .env.example .env
npm run dev
```

Development dashboard:

```text
http://127.0.0.1:5173
```

API server:

```text
http://127.0.0.1:3001
```

WebSocket endpoint:

```text
ws://127.0.0.1:3001/ws
```

## Local SSH Mode

Create an SSH key for the monitor tool:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/vps_monitor
```

Copy the public key to your VPS:

```bash
ssh-copy-id -i ~/.ssh/vps_monitor.pub root@your-vps-ip
```

Trust the VPS host key on your machine:

```bash
ssh-keyscan -p 22 your-vps-ip >> ~/.ssh/known_hosts
```

Then open the dashboard and add a target:

- Name: display name in the dashboard.
- Host: VPS IP or hostname.
- Port: usually `22`.
- User: SSH username, for example `root`.
- Private key path: local path, for example `~/.ssh/vps_monitor`.

Click `Scan` or `Scan all`. The local API connects to the VPS through SSH, runs read-only monitor commands, converts the result into a server snapshot, stores the latest state locally, and pushes the new overview to the browser via WebSocket.

If the host key is missing or changed, the scan is rejected. This is intentional: the dashboard follows the same trust boundary as SSH and does not silently accept unknown servers.

The scanner currently checks:

- Host metrics from Linux system files and commands.
- Docker containers from `docker ps`, `docker stats`, and `docker inspect`.
- PM2 processes from `pm2 jlist`.

If Docker or PM2 is not installed on a VPS, that runtime simply reports no apps.

## Runtime Metrics

- Docker apps report CPU, memory, image, ports, status, health, and restart count.
- PM2 apps report CPU, memory, process status, uptime, and restart count.
- Docker manual restarts are detected by comparing the container `StartedAt` value between scans.

## Reset Local Data

```bash
npm run reset:data
```

This resets `DATA_FILE`, defaulting to `./data/monitor-state.json`. Restart the API process after resetting because the server keeps current state in memory.

SSH targets are stored separately in `SSH_TARGETS_FILE`, defaulting to `./data/ssh-targets.json`.

## Build

```bash
npm run build
npm start
```

## Environment Variables

- `HOST`: API bind host. Defaults to `127.0.0.1`.
- `PORT`: API port. Defaults to `3001`.
- `DATA_FILE`: local monitor state file. Defaults to `./data/monitor-state.json`.
- `SSH_TARGETS_FILE`: local SSH target config file. Defaults to `./data/ssh-targets.json`.
- `SSH_COMMAND_TIMEOUT_MS`: SSH connect/command timeout. Defaults to `12000`.
- `OFFLINE_AFTER_MS`: timeout before a VPS is marked offline.
- `REALTIME_BROADCAST_MS`: interval for periodic WebSocket overview broadcasts.
