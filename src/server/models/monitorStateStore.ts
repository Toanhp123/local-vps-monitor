import fs from "node:fs";
import path from "node:path";
import type { IncidentEvent, ServerMetricPoint, StoredServer } from "../../shared/types";

interface MonitorState {
  servers: Record<string, StoredServer>;
}

type LegacyStoredServer = Omit<
  StoredServer,
  "collectorVersion" | "incidents" | "metricsHistory"
> & {
  agentVersion?: string;
  collectorVersion?: string;
  incidents?: IncidentEvent[];
  metricsHistory?: ServerMetricPoint[];
};

const emptyState = (): MonitorState => ({ servers: {} });

const normalizeStoredServer = (server: LegacyStoredServer): StoredServer => {
  const { agentVersion, collectorVersion, ...serverWithoutLegacyVersion } = server;

  return {
    ...serverWithoutLegacyVersion,
    collectorVersion: collectorVersion || agentVersion || "unknown",
    incidents: Array.isArray(server.incidents) ? server.incidents : [],
    metricsHistory: Array.isArray(server.metricsHistory) ? server.metricsHistory : []
  };
};

const normalizeState = (state: MonitorState): MonitorState => {
  return {
    servers: Object.fromEntries(
      Object.entries(state.servers).map(([serverId, server]) => [
        serverId,
        normalizeStoredServer(server as LegacyStoredServer)
      ])
    )
  };
};

export class MonitorStateStore {
  private state: MonitorState;

  constructor(private readonly filePath: string) {
    this.state = this.load();
  }

  getServer(serverId: string) {
    return this.state.servers[serverId];
  }

  listServers() {
    return Object.values(this.state.servers);
  }

  upsertServer(server: StoredServer) {
    this.state.servers[server.serverId] = server;
    this.save();

    return server;
  }

  private load(): MonitorState {
    if (!fs.existsSync(this.filePath)) return emptyState();

    try {
      const raw = fs.readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as MonitorState;
      return parsed && parsed.servers ? normalizeState(parsed) : emptyState();
    } catch (error) {
      console.warn(`Cannot read monitor state at ${this.filePath}:`, error);
      return emptyState();
    }
  }

  private save() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });

    const tempPath = `${this.filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(this.state, null, 2), {
      mode: 0o600
    });
    fs.renameSync(tempPath, this.filePath);

    if (process.platform !== "win32") {
      fs.chmodSync(this.filePath, 0o600);
    }
  }
}
