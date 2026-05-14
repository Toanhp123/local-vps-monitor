import path from "node:path";

const numberFromEnv = (name: string, fallback: number) => {
  const raw = process.env[name];
  if (!raw) return fallback;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const serverConfig = {
  port: numberFromEnv("PORT", 3001),
  host: process.env.HOST || "127.0.0.1",
  version: process.env.npm_package_version || "0.1.0",
  dataFile: path.resolve(process.cwd(), process.env.DATA_FILE || "./data/monitor-state.json"),
  sshTargetsFile: path.resolve(process.cwd(), process.env.SSH_TARGETS_FILE || "./data/ssh-targets.json"),
  offlineAfterMs: numberFromEnv("OFFLINE_AFTER_MS", 60_000),
  realtimeBroadcastMs: numberFromEnv("REALTIME_BROADCAST_MS", 5_000),
  sshCommandTimeoutMs: numberFromEnv("SSH_COMMAND_TIMEOUT_MS", 12_000)
};
