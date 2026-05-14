import type { AppSnapshot, HealthStatus } from "../../shared/types";
import { runCommand } from "../command";

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

export const collectDockerApps = async (dockerBin: string): Promise<AppSnapshot[]> => {
  const psResult = await runCommand(dockerBin, ["ps", "-a", "--format", "{{json .}}"]);
  if (!psResult.ok || !psResult.stdout.trim()) return [];

  const statsResult = await runCommand(dockerBin, ["stats", "--no-stream", "--format", "{{json .}}"], 8_000);
  const stats = new Map<string, DockerStatsRow>();

  if (statsResult.ok) {
    for (const row of parseJsonLines<DockerStatsRow>(statsResult.stdout)) {
      if (row.ID) stats.set(row.ID, row);
      if (row.Container) stats.set(row.Container, row);
      if (row.Name) stats.set(row.Name, row);
    }
  }

  return parseJsonLines<DockerPsRow>(psResult.stdout).map((row) => {
    const stat = stats.get(row.ID || "") || stats.get(row.Names || "");

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
      raw: {
        dockerId: row.ID,
        state: row.State
      }
    };
  });
};
