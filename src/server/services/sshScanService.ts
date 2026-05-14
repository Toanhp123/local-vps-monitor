import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Client } from "ssh2";
import type { AppSnapshot, HealthStatus, HeartbeatPayload, HostMetrics, SshScanAllResponse, SshScanResult, SshTarget, SshTargetCreateInput } from "../../shared/types";
import type { SshTargetConfigStore } from "../models/sshTargetConfigStore";
import type { MonitorOverviewService } from "./monitorOverviewService";

interface RemoteCommandResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  code?: number;
}

interface DockerPsRow {
  ID?: string;
  Image?: string;
  Names?: string;
  Ports?: string;
  State?: string;
  Status?: string;
}

interface DockerStatsRow {
  ID?: string;
  Container?: string;
  Name?: string;
  CPUPerc?: string;
  MemUsage?: string;
}

interface DockerInspectRow {
  Id?: string;
  Name?: string;
  RestartCount?: number;
  State?: {
    StartedAt?: string;
  };
}

interface DockerInspectMetadata {
  restartCount?: number;
  startedAt?: string;
}

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
  };
}

export class SshTargetNotFoundError extends Error {
  constructor(targetId: string) {
    super(`SSH target not found: ${targetId}`);
    this.name = "SshTargetNotFoundError";
  }
}

const errorMessage = (error: unknown) => {
  return error instanceof Error ? error.message : String(error);
};

const firstLine = (value: string, fallback = "") => {
  return value.split(/\r?\n/).map((line) => line.trim()).find(Boolean) || fallback;
};

const parseNumber = (value: string | undefined, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseJsonLines = <T>(raw: string): T[] => {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as T];
      } catch {
        return [];
      }
    });
};

const expandHomePath = (filePath: string) => {
  if (filePath === "~") return os.homedir();

  if (filePath.startsWith("~/") || filePath.startsWith("~\\")) {
    return path.join(os.homedir(), filePath.slice(2));
  }

  return filePath;
};

const resolvePrivateKeyPath = (filePath: string) => {
  const expanded = expandHomePath(filePath);
  return path.isAbsolute(expanded) ? expanded : path.resolve(process.cwd(), expanded);
};

const connectSsh = (target: SshTarget, timeoutMs: number) => {
  return new Promise<Client>((resolve, reject) => {
    let privateKey: Buffer;

    try {
      privateKey = fs.readFileSync(resolvePrivateKeyPath(target.privateKeyPath));
    } catch (error) {
      reject(new Error(`Cannot read private key file: ${errorMessage(error)}`));
      return;
    }

    const client = new Client();
    const timer = setTimeout(() => {
      cleanup();
      client.end();
      reject(new Error(`SSH connection timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timer);
      client.off("ready", onReady);
      client.off("error", onError);
    };

    const onReady = () => {
      cleanup();
      resolve(client);
    };

    const onError = (error: Error) => {
      cleanup();
      client.end();
      reject(error);
    };

    client.once("ready", onReady);
    client.once("error", onError);
    client.connect({
      host: target.host,
      port: target.port,
      username: target.username,
      privateKey,
      readyTimeout: timeoutMs,
      tryKeyboard: false
    });
  });
};

const runRemoteCommand = (client: Client, command: string, timeoutMs: number) => {
  return new Promise<RemoteCommandResult>((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      settled = true;
      reject(new Error(`Remote command timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    client.exec(command, (error, stream) => {
      if (settled) return;

      if (error) {
        clearTimeout(timer);
        settled = true;
        reject(error);
        return;
      }

      stream.on("data", (chunk: Buffer) => {
        stdout += chunk.toString("utf8");
      });

      stream.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString("utf8");
      });

      stream.on("close", (code: number | null) => {
        if (settled) return;

        clearTimeout(timer);
        settled = true;
        resolve({
          ok: code === 0,
          stdout,
          stderr,
          code: code ?? undefined
        });
      });
    });
  });
};

const safeRun = async (client: Client, command: string, timeoutMs: number): Promise<RemoteCommandResult> => {
  try {
    return await runRemoteCommand(client, command, timeoutMs);
  } catch (error) {
    return {
      ok: false,
      stdout: "",
      stderr: errorMessage(error)
    };
  }
};

const parseLoadAverage = (raw: string) => {
  const values = firstLine(raw, "0 0 0")
    .split(/\s+/)
    .slice(0, 3)
    .map((value) => parseNumber(value));

  while (values.length < 3) values.push(0);
  return values;
};

const parseMemInfo = (raw: string) => {
  const values = new Map<string, number>();

  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_()]+):\s+(\d+)/);
    if (!match) continue;

    values.set(match[1], Number(match[2]) * 1024);
  }

  const total = values.get("MemTotal") ?? 0;
  const free = values.get("MemAvailable") ?? values.get("MemFree") ?? 0;

  return {
    total,
    free
  };
};

const parsePercent = (value?: string) => {
  if (!value) return undefined;

  const parsed = Number(value.replace("%", ""));
  return Number.isFinite(parsed) ? parsed : undefined;
};

const unitToBytes: Record<string, number> = {
  B: 1,
  KB: 1_000,
  MB: 1_000_000,
  GB: 1_000_000_000,
  TB: 1_000_000_000_000,
  KiB: 1024,
  MiB: 1024 ** 2,
  GiB: 1024 ** 3,
  TiB: 1024 ** 4
};

const parseMemoryBytes = (value?: string) => {
  if (!value) return undefined;

  const firstValue = value.split("/")[0]?.trim();
  const match = firstValue?.match(/^([\d.]+)\s*([KMGT]?i?B)$/i);
  if (!match) return undefined;

  const amount = Number(match[1]);
  const unit = match[2];
  const multiplier = unitToBytes[unit] ?? unitToBytes[unit.toUpperCase()];

  if (!Number.isFinite(amount) || !multiplier) return undefined;
  return Math.round(amount * multiplier);
};

const dockerHealth = (state?: string, status?: string): HealthStatus => {
  const normalizedState = state?.toLowerCase();
  const normalizedStatus = status?.toLowerCase() || "";

  if (normalizedStatus.includes("unhealthy")) return "warning";
  if (normalizedState === "running") return "healthy";
  if (["exited", "dead", "removing"].includes(normalizedState || "")) return "down";
  if (normalizedState) return "warning";

  return "unknown";
};

const pm2Health = (status?: string): HealthStatus => {
  const normalized = status?.toLowerCase();

  if (normalized === "online") return "healthy";
  if (normalized === "stopped" || normalized === "errored") return "down";
  if (normalized === "launching" || normalized === "stopping") return "warning";

  return "unknown";
};

const collectHostMetrics = async (client: Client, timeoutMs: number): Promise<HostMetrics> => {
  const [hostname, platform, arch, uptime, cpuCount, loadAverage, memInfo] = await Promise.all([
    safeRun(client, "hostname 2>/dev/null || uname -n 2>/dev/null || echo unknown", timeoutMs),
    safeRun(client, "uname -s 2>/dev/null || echo linux", timeoutMs),
    safeRun(client, "uname -m 2>/dev/null || echo unknown", timeoutMs),
    safeRun(client, "cat /proc/uptime 2>/dev/null || echo 0", timeoutMs),
    safeRun(client, "nproc 2>/dev/null || getconf _NPROCESSORS_ONLN 2>/dev/null || echo 1", timeoutMs),
    safeRun(client, "cat /proc/loadavg 2>/dev/null || echo '0 0 0'", timeoutMs),
    safeRun(client, "cat /proc/meminfo 2>/dev/null || true", timeoutMs)
  ]);
  const memory = parseMemInfo(memInfo.stdout);

  return {
    hostname: firstLine(hostname.stdout, "unknown"),
    platform: firstLine(platform.stdout, "linux").toLowerCase(),
    arch: firstLine(arch.stdout, "unknown"),
    uptimeSeconds: parseNumber(firstLine(uptime.stdout).split(/\s+/)[0], 0),
    loadAverage: parseLoadAverage(loadAverage.stdout),
    cpuCount: Math.max(1, Math.round(parseNumber(firstLine(cpuCount.stdout), 1))),
    memoryTotalBytes: memory.total,
    memoryFreeBytes: memory.free
  };
};

const collectDockerInspectMetadata = async (
  client: Client,
  containers: DockerPsRow[],
  timeoutMs: number
) => {
  const containerRefs = containers
    .map((container) => container.ID)
    .filter((value): value is string => Boolean(value && /^[a-f0-9]{12,64}$/i.test(value)));

  const metadata = new Map<string, DockerInspectMetadata>();
  if (containerRefs.length === 0) return metadata;

  const inspectResult = await safeRun(
    client,
    `docker inspect --format '{{json .}}' ${containerRefs.join(" ")}`,
    timeoutMs
  );
  if (!inspectResult.ok || !inspectResult.stdout.trim()) return metadata;

  for (const row of parseJsonLines<DockerInspectRow>(inspectResult.stdout)) {
    const entry: DockerInspectMetadata = {
      restartCount: typeof row.RestartCount === "number" ? row.RestartCount : undefined,
      startedAt: row.State?.StartedAt
    };

    if (row.Id) {
      metadata.set(row.Id, entry);
      metadata.set(row.Id.slice(0, 12), entry);
    }

    if (row.Name) {
      metadata.set(row.Name.replace(/^\//, ""), entry);
    }
  }

  return metadata;
};

const collectDockerApps = async (client: Client, timeoutMs: number): Promise<AppSnapshot[]> => {
  const psResult = await safeRun(
    client,
    "command -v docker >/dev/null 2>&1 && docker ps -a --format '{{json .}}' || true",
    timeoutMs
  );
  if (!psResult.stdout.trim()) return [];

  const containers = parseJsonLines<DockerPsRow>(psResult.stdout);
  const [statsResult, inspectMetadata] = await Promise.all([
    safeRun(
      client,
      "command -v docker >/dev/null 2>&1 && docker stats --no-stream --format '{{json .}}' || true",
      timeoutMs
    ),
    collectDockerInspectMetadata(client, containers, timeoutMs)
  ]);
  const stats = new Map<string, DockerStatsRow>();

  if (statsResult.ok) {
    for (const row of parseJsonLines<DockerStatsRow>(statsResult.stdout)) {
      if (row.ID) stats.set(row.ID, row);
      if (row.Container) stats.set(row.Container, row);
      if (row.Name) stats.set(row.Name, row);
    }
  }

  return containers.map((row) => {
    const stat = stats.get(row.ID || "") || stats.get(row.Names || "");
    const metadata = inspectMetadata.get(row.ID || "") || inspectMetadata.get(row.Names || "");

    return {
      id: `docker:${row.ID || row.Names}`,
      name: row.Names || row.ID || "unknown-container",
      kind: "docker",
      status: row.Status || row.State || "unknown",
      health: dockerHealth(row.State, row.Status),
      cpuPercent: parsePercent(stat?.CPUPerc),
      memoryBytes: parseMemoryBytes(stat?.MemUsage),
      image: row.Image,
      ports: row.Ports,
      restarts: metadata?.restartCount,
      raw: {
        dockerId: row.ID,
        state: row.State,
        startedAt: metadata?.startedAt
      }
    };
  });
};

const collectPm2Apps = async (client: Client, timeoutMs: number): Promise<AppSnapshot[]> => {
  const result = await safeRun(client, "command -v pm2 >/dev/null 2>&1 && pm2 jlist || true", timeoutMs);
  if (!result.stdout.trim()) return [];

  let rows: Pm2Process[];
  try {
    rows = JSON.parse(result.stdout) as Pm2Process[];
  } catch {
    return [];
  }

  return rows.map((row) => {
    const uptimeMs = row.pm2_env?.pm_uptime ? Date.now() - row.pm2_env.pm_uptime : undefined;

    return {
      id: `pm2:${row.pm_id ?? row.name}`,
      name: row.name || `pm2-${row.pm_id ?? "unknown"}`,
      kind: "pm2",
      status: row.pm2_env?.status || "unknown",
      health: pm2Health(row.pm2_env?.status),
      cpuPercent: typeof row.monit?.cpu === "number" ? row.monit.cpu : undefined,
      memoryBytes: typeof row.monit?.memory === "number" ? row.monit.memory : undefined,
      restarts: row.pm2_env?.restart_time,
      uptimeSeconds: uptimeMs ? Math.max(0, Math.round(uptimeMs / 1000)) : undefined,
      raw: {
        pmId: row.pm_id,
        interpreter: row.pm2_env?.exec_interpreter
      }
    };
  });
};

export class SshScanService {
  constructor(
    private readonly targetConfigStore: SshTargetConfigStore,
    private readonly monitorOverviewService: MonitorOverviewService,
    private readonly commandTimeoutMs: number,
    private readonly version: string
  ) {}

  listTargets() {
    return this.targetConfigStore.list();
  }

  createTarget(input: SshTargetCreateInput) {
    return this.targetConfigStore.create(input);
  }

  deleteTarget(targetId: string) {
    return this.targetConfigStore.delete(targetId);
  }

  async scanTarget(targetId: string) {
    const target = this.targetConfigStore.get(targetId);
    if (!target) throw new SshTargetNotFoundError(targetId);

    return this.scanKnownTarget(target);
  }

  async scanAllTargets(): Promise<SshScanAllResponse> {
    const targets = this.targetConfigStore.list().filter((target) => target.enabled);
    const settled = await Promise.allSettled(targets.map((target) => this.scanKnownTarget(target)));

    return settled.reduce<SshScanAllResponse>(
      (response, result, index) => {
        if (result.status === "fulfilled") {
          response.results.push(result.value);
        } else {
          response.errors.push({
            targetId: targets[index]?.id || "unknown",
            message: errorMessage(result.reason)
          });
        }

        return response;
      },
      { results: [], errors: [] }
    );
  }

  private async scanKnownTarget(target: SshTarget): Promise<SshScanResult> {
    const client = await connectSsh(target, this.commandTimeoutMs);

    try {
      const [host, dockerApps, pm2Apps] = await Promise.all([
        collectHostMetrics(client, this.commandTimeoutMs),
        collectDockerApps(client, this.commandTimeoutMs),
        collectPm2Apps(client, this.commandTimeoutMs)
      ]);
      const payload: HeartbeatPayload = {
        serverId: target.id,
        serverName: target.name,
        agentVersion: `local-ssh/${this.version}`,
        observedAt: new Date().toISOString(),
        host,
        apps: [...dockerApps, ...pm2Apps]
      };
      const server = this.monitorOverviewService.ingestHeartbeat(payload);

      return {
        targetId: target.id,
        serverId: server.serverId,
        serverName: server.serverName,
        appCount: server.apps.length,
        scannedAt: server.lastSeenAt
      };
    } finally {
      client.end();
    }
  }
}
