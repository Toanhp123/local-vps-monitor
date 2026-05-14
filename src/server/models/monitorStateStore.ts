import fs from "node:fs";
import path from "node:path";
import type {
  AppSnapshot,
  HealthStatus,
  HeartbeatPayload,
  OverviewResponse,
  OverviewSummary,
  StoredServer
} from "../../shared/types";

interface MonitorState {
  servers: Record<string, StoredServer>;
}

const emptyState = (): MonitorState => ({ servers: {} });

const statusRank: Record<HealthStatus, number> = {
  down: 4,
  warning: 3,
  unknown: 2,
  healthy: 1
};

const worstStatus = (statuses: HealthStatus[]): HealthStatus => {
  if (statuses.length === 0) return "unknown";

  return statuses.reduce<HealthStatus>((worst, status) => {
    return statusRank[status] > statusRank[worst] ? status : worst;
  }, "healthy");
};

const sortApps = (apps: AppSnapshot[]) => {
  return [...apps].sort((left, right) => {
    const kindCompare = left.kind.localeCompare(right.kind);
    if (kindCompare !== 0) return kindCompare;

    return left.name.localeCompare(right.name);
  });
};

const rawString = (app: AppSnapshot | undefined, key: string) => {
  const value = app?.raw?.[key];
  return typeof value === "string" ? value : undefined;
};

const withObservedRestarts = (apps: AppSnapshot[], previousApps: AppSnapshot[] = []) => {
  const previousById = new Map(previousApps.map((app) => [app.id, app]));

  return apps.map((app) => {
    if (app.kind !== "docker") return app;

    const previous = previousById.get(app.id);
    const previousRestarts = previous?.restarts;
    const currentStartedAt = rawString(app, "startedAt");
    const previousStartedAt = rawString(previous, "startedAt");
    let restarts = app.restarts;

    if (typeof previousRestarts === "number" && typeof restarts === "number") {
      restarts = Math.max(restarts, previousRestarts);
    }

    if (currentStartedAt && previousStartedAt && currentStartedAt !== previousStartedAt) {
      restarts = Math.max(restarts ?? 0, (previousRestarts ?? 0) + 1);
    }

    return {
      ...app,
      restarts
    };
  });
};

export class MonitorStateStore {
  private state: MonitorState;

  constructor(
    private readonly filePath: string,
    private readonly offlineAfterMs: number
  ) {
    this.state = this.load();
  }

  ingest(payload: HeartbeatPayload): StoredServer {
    const previousServer = this.state.servers[payload.serverId];
    const apps = withObservedRestarts(payload.apps, previousServer?.apps);

    const server: StoredServer = {
      ...payload,
      apps: sortApps(apps),
      lastSeenAt: new Date().toISOString(),
      online: true,
      status: worstStatus(apps.map((app) => app.health))
    };

    this.state.servers[payload.serverId] = server;
    this.save();

    return server;
  }

  overview(): OverviewResponse {
    const generatedAt = new Date();
    const servers = Object.values(this.state.servers)
      .map((server) => this.withRuntimeStatus(server, generatedAt))
      .sort((left, right) => left.serverName.localeCompare(right.serverName));

    return {
      generatedAt: generatedAt.toISOString(),
      summary: this.summary(servers),
      servers
    };
  }

  private withRuntimeStatus(server: StoredServer, now: Date): StoredServer {
    const lastSeenMs = new Date(server.lastSeenAt).getTime();
    const online = Number.isFinite(lastSeenMs) && now.getTime() - lastSeenMs <= this.offlineAfterMs;

    return {
      ...server,
      online,
      status: online ? worstStatus(server.apps.map((app) => app.health)) : "down"
    };
  }

  private summary(servers: StoredServer[]): OverviewSummary {
    const apps = servers.flatMap((server) => server.apps);

    return {
      totalServers: servers.length,
      onlineServers: servers.filter((server) => server.online).length,
      totalApps: apps.length,
      healthyApps: apps.filter((app) => app.health === "healthy").length,
      warningApps: apps.filter((app) => app.health === "warning").length,
      downApps: apps.filter((app) => app.health === "down").length,
      unknownApps: apps.filter((app) => app.health === "unknown").length
    };
  }

  private load(): MonitorState {
    if (!fs.existsSync(this.filePath)) return emptyState();

    try {
      const raw = fs.readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as MonitorState;
      return parsed && parsed.servers ? parsed : emptyState();
    } catch (error) {
      console.warn(`Cannot read monitor state at ${this.filePath}:`, error);
      return emptyState();
    }
  }

  private save() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });

    const tempPath = `${this.filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(this.state, null, 2));
    fs.renameSync(tempPath, this.filePath);
  }
}
