import os from "node:os";

const numberFromEnv = (name: string, fallback: number) => {
  const raw = process.env[name];
  if (!raw) return fallback;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const hostname = os.hostname();

export const agentConfig = {
  serverUrl: process.env.AGENT_SERVER_URL || "http://localhost:3001",
  token: process.env.AGENT_TOKEN || "change-me",
  serverId: process.env.AGENT_SERVER_ID || hostname,
  serverName: process.env.AGENT_SERVER_NAME || hostname,
  intervalMs: numberFromEnv("AGENT_INTERVAL_MS", 15_000),
  dockerBin: process.env.DOCKER_BIN || "docker",
  pm2Bin: process.env.PM2_BIN || "pm2"
};
