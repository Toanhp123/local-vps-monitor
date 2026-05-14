import type {
  AppSnapshot,
  HealthStatus,
  HeartbeatPayload,
  OverviewResponse,
  OverviewSummary,
  StoredServer
} from "../../shared/types";

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

const withRuntimeStatus = (server: StoredServer, now: Date, offlineAfterMs: number): StoredServer => {
  const lastSeenMs = new Date(server.lastSeenAt).getTime();
  const online = Number.isFinite(lastSeenMs) && now.getTime() - lastSeenMs <= offlineAfterMs;

  return {
    ...server,
    online,
    status: online ? worstStatus(server.apps.map((app) => app.health)) : "down"
  };
};

const summary = (servers: StoredServer[]): OverviewSummary => {
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
};

export const createStoredServerFromHeartbeat = (
  payload: HeartbeatPayload,
  previousServer: StoredServer | undefined,
  receivedAt: Date
): StoredServer => {
  const apps = sortApps(withObservedRestarts(payload.apps, previousServer?.apps));

  return {
    ...payload,
    apps,
    lastSeenAt: receivedAt.toISOString(),
    online: true,
    status: worstStatus(apps.map((app) => app.health))
  };
};

export const buildOverview = (storedServers: StoredServer[], offlineAfterMs: number, now = new Date()): OverviewResponse => {
  const servers = storedServers
    .map((server) => withRuntimeStatus(server, now, offlineAfterMs))
    .sort((left, right) => left.serverName.localeCompare(right.serverName));

  return {
    generatedAt: now.toISOString(),
    summary: summary(servers),
    servers
  };
};
