# VPS Monitor

VPS Monitor is an MVP dashboard for tracking applications deployed across multiple VPS instances. Each VPS runs a lightweight agent that collects host metrics, Docker container status, and PM2 process status, then pushes heartbeat data to a central dashboard.

## Architecture

- `server`: Express API, WebSocket broadcaster, and production static dashboard server. It receives heartbeats at `POST /api/ingest/heartbeat` and streams overview updates at `/ws`.
- `agent`: Node.js process installed on each VPS. It collects host, Docker, and PM2 metrics.
- `client`: React dashboard that subscribes to `/ws` for live updates and uses `GET /api/overview` for initial loading, manual refresh, and fallback.
- `storage`: JSON file storage configured by `DATA_FILE`, defaulting to `./data/monitor-state.json`.

The system uses a push-based agent model. The central server does not need to SSH into each VPS and does not need to store SSH keys.

For a detailed Vietnamese explanation of the idea, architecture, CV wording, and interview notes, see `docs/project-explanation.md`.

## Server Structure

The API server uses a simple MVC-style structure because the current backend has a small number of endpoints and limited CRUD complexity.

```text
src/server
├── index.ts                 # server bootstrap
├── app.ts                   # Express app composition
├── config.ts                # environment configuration
├── routes                   # HTTP route definitions
├── controllers              # request/response handlers
├── services                 # application use cases
├── models                   # persistence/state model
├── realtime                 # WebSocket gateway
└── validators               # request payload schemas
```

In this project, the React app acts as the View layer. The Express server follows the routing/controller/service/model split to keep request handling, business logic, and storage concerns separate.

## Client Structure

The React client follows a lightweight Feature-Sliced Design structure and uses Tailwind CSS for styling:

```text
src/client
├── app                      # app bootstrap and global styles
├── pages                    # route-level screens
├── widgets                  # composed dashboard sections
├── entities                 # domain UI for servers and applications
└── shared                   # API clients, formatting helpers, reusable UI
```

The dashboard page owns data loading and realtime state. Widgets only compose UI sections, entities render domain-specific blocks, and shared code contains reusable API, formatting, and UI utilities. The global stylesheet only imports Tailwind; component-specific styling is expressed with utility classes colocated with each component.

## Realtime Updates

Agents still send metrics to the server with authenticated HTTP heartbeats. After each heartbeat, the server broadcasts the latest overview to connected dashboard clients over WebSocket.

```text
Agent ---> POST /api/ingest/heartbeat ---> Server
Server ---> WebSocket /ws ---> React dashboard
```

The server also sends periodic WebSocket overview updates so the dashboard can reflect offline timeout changes even when no new heartbeat arrives.

The client WebSocket connection includes automatic reconnect with exponential backoff, stale socket detection, and HTTP polling fallback when the realtime connection is unavailable.

## Local Development

```bash
npm install
copy .env.example .env
npm run dev
```

Development dashboard: `http://localhost:5173`

API server: `http://localhost:3001`

WebSocket endpoint: `ws://localhost:3001/ws`

## Run A Local Agent For Testing

Open another terminal:

```bash
$env:AGENT_SERVER_URL="http://localhost:3001"
$env:AGENT_TOKEN="change-me"
$env:AGENT_SERVER_ID="local-dev"
$env:AGENT_SERVER_NAME="Local Dev"
npm run dev:agent
```

On a Linux VPS:

```bash
export AGENT_SERVER_URL="https://monitor.example.com"
export AGENT_TOKEN="your-secret-token"
export AGENT_SERVER_ID="vps-01"
export AGENT_SERVER_NAME="VPS 01"
npm run start:agent
```

## Production Build

```bash
npm run build
INGEST_TOKEN=your-secret-token npm start
```

Production agent:

```bash
AGENT_SERVER_URL=https://monitor.example.com \
AGENT_TOKEN=your-secret-token \
AGENT_SERVER_ID=vps-01 \
AGENT_SERVER_NAME="VPS 01" \
npm run start:agent
```

## Deploy The Central Dashboard With Docker

```bash
INGEST_TOKEN=your-secret-token docker compose up -d --build
```

The production dashboard will be available at:

```text
http://server-ip:3001
```

## Install The Agent With systemd

Build the project once, copy the project directory to `/opt/vps-monitor` on the VPS, edit `deploy/vps-monitor-agent.service.example` with the correct URL, token, and server ID, then install it as a systemd service:

```bash
sudo cp deploy/vps-monitor-agent.service.example /etc/systemd/system/vps-monitor-agent.service
sudo systemctl daemon-reload
sudo systemctl enable --now vps-monitor-agent
```

## Environment Variables

- `INGEST_TOKEN`: token used by the central server to authenticate heartbeat requests.
- `AGENT_TOKEN`: token sent by the agent. It must match `INGEST_TOKEN`.
- `OFFLINE_AFTER_MS`: heartbeat timeout before a VPS is marked offline.
- `REALTIME_BROADCAST_MS`: interval for periodic WebSocket overview broadcasts.
- `AGENT_INTERVAL_MS`: interval between agent heartbeat requests.
- `DOCKER_BIN`: Docker command path if Docker is not available in `PATH`.
- `PM2_BIN`: PM2 command path if PM2 is not available in `PATH`.
