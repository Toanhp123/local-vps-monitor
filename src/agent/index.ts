import { agentConfig } from "./config";
import { collectDockerApps } from "./collectors/docker";
import { collectHostMetrics } from "./collectors/host";
import { collectPm2Apps } from "./collectors/pm2";
import type { HeartbeatPayload } from "../shared/types";

const agentVersion = "0.1.0";

const buildHeartbeat = async (): Promise<HeartbeatPayload> => {
  const [dockerApps, pm2Apps] = await Promise.all([
    collectDockerApps(agentConfig.dockerBin),
    collectPm2Apps(agentConfig.pm2Bin)
  ]);

  return {
    serverId: agentConfig.serverId,
    serverName: agentConfig.serverName,
    agentVersion,
    observedAt: new Date().toISOString(),
    host: collectHostMetrics(),
    apps: [...dockerApps, ...pm2Apps]
  };
};

const postHeartbeat = async () => {
  const heartbeat = await buildHeartbeat();
  const endpoint = new URL("/api/ingest/heartbeat", agentConfig.serverUrl);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${agentConfig.token}`
    },
    body: JSON.stringify(heartbeat)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Heartbeat failed with ${response.status}: ${body}`);
  }

  console.log(
    `[${new Date().toISOString()}] sent heartbeat for ${agentConfig.serverName} (${heartbeat.apps.length} apps)`
  );
};

let stopped = false;

const tick = async () => {
  try {
    await postHeartbeat();
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!stopped) {
    setTimeout(tick, agentConfig.intervalMs);
  }
};

process.on("SIGINT", () => {
  stopped = true;
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopped = true;
  process.exit(0);
});

tick();
