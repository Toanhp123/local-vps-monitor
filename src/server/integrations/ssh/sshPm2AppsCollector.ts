import type { Client } from "ssh2";
import type { AppSnapshot, HealthStatus } from "../../../shared/types";
import { safeRunSshCommand } from "./sshCommandRunner";

interface Pm2Process {
  name?: string;
  pm_id?: number;
  monit?: {
    cpu?: number;
    memory?: number;
  };
  pm2_env?: {
    status?: string;
    restart_time?: number;
    pm_uptime?: number;
    exec_interpreter?: string;
    namespace?: string;
  };
}

const pm2Health = (status?: string): HealthStatus => {
  const normalized = status?.toLowerCase();

  if (normalized === "online") return "healthy";
  if (normalized === "stopped" || normalized === "errored") return "down";
  if (normalized === "launching" || normalized === "stopping") return "warning";

  return "unknown";
};

export const collectSshPm2Apps = async (client: Client, timeoutMs: number): Promise<AppSnapshot[]> => {
  const result = await safeRunSshCommand(client, "command -v pm2 >/dev/null 2>&1 && pm2 jlist || true", timeoutMs);
  if (!result.stdout.trim()) return [];

  let rows: Pm2Process[];
  try {
    rows = JSON.parse(result.stdout) as Pm2Process[];
  } catch {
    return [];
  }

  return rows.map((row) => {
    const uptimeMs = row.pm2_env?.pm_uptime ? Date.now() - row.pm2_env.pm_uptime : undefined;
    const namespace = row.pm2_env?.namespace || "default";

    return {
      id: `pm2:${row.pm_id ?? row.name}`,
      name: row.name || `pm2-${row.pm_id ?? "unknown"}`,
      kind: "pm2",
      status: row.pm2_env?.status || "unknown",
      health: pm2Health(row.pm2_env?.status),
      group: {
        id: `pm2:${namespace}`,
        name: namespace === "default" ? "PM2 default" : namespace,
        source: "pm2"
      },
      cpuPercent: typeof row.monit?.cpu === "number" ? row.monit.cpu : undefined,
      memoryBytes: typeof row.monit?.memory === "number" ? row.monit.memory : undefined,
      restarts: row.pm2_env?.restart_time,
      uptimeSeconds: uptimeMs ? Math.max(0, Math.round(uptimeMs / 1000)) : undefined,
      raw: {
        pmId: row.pm_id,
        interpreter: row.pm2_env?.exec_interpreter,
        namespace
      }
    };
  });
};
