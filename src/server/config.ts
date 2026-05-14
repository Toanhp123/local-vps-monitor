import path from "node:path";

const numberFromEnv = (name: string, fallback: number) => {
  const raw = process.env[name];
  if (!raw) return fallback;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const serverConfig = {
  port: numberFromEnv("PORT", 3001),
  version: process.env.npm_package_version || "0.1.0",
  ingestToken: process.env.INGEST_TOKEN || "change-me",
  dataFile: path.resolve(process.cwd(), process.env.DATA_FILE || "./data/monitor-state.json"),
  offlineAfterMs: numberFromEnv("OFFLINE_AFTER_MS", 60_000),
  realtimeBroadcastMs: numberFromEnv("REALTIME_BROADCAST_MS", 5_000)
};
