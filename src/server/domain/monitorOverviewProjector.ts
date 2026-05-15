import type {
	AppSnapshot,
	HealthStatus,
	IncidentEvent,
	IncidentSeverity,
	OverviewResponse,
	OverviewSummary,
	ServerMetricPoint,
	ServerSnapshotPayload,
	StoredServer,
} from "../../shared/types";

const maxMetricHistoryPoints = 60;
const maxIncidentEvents = 100;

const healthLabels: Record<HealthStatus, string> = {
	down: "Down",
	warning: "Warning",
	unknown: "Unknown",
	healthy: "Healthy",
};

const statusRank: Record<HealthStatus, number> = {
	down: 4,
	warning: 3,
	unknown: 2,
	healthy: 1,
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

const numberOrZero = (value: number | undefined) => {
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

const incidentSeverityForHealth = (health: HealthStatus): IncidentSeverity => {
	if (health === "healthy") return "resolved";
	if (health === "down") return "critical";
	if (health === "warning") return "warning";

	return "warning";
};

const incidentId = (
	serverId: string,
	kind: string,
	subjectId: string,
	observedAt: Date,
	suffix = "",
) => {
	return [serverId, kind, subjectId, observedAt.toISOString(), suffix]
		.filter(Boolean)
		.join(":");
};

const appKindLabel = (app: AppSnapshot) => app.kind.toUpperCase();

const createAppHealthIncident = (
	app: AppSnapshot,
	payload: ServerSnapshotPayload,
	observedAt: Date,
	previousApp?: AppSnapshot,
): IncidentEvent | null => {
	if (!previousApp && app.health === "healthy") return null;
	if (previousApp && previousApp.health === app.health) return null;

	const previousHealth = previousApp?.health;
	const currentLabel = healthLabels[app.health];
	const previousLabel = previousHealth ? healthLabels[previousHealth] : "new";
	const isRecovered = app.health === "healthy";

	return {
		id: incidentId(
			payload.serverId,
			"app-health",
			app.id,
			observedAt,
			app.health,
		),
		appId: app.id,
		appName: app.name,
		currentHealth: app.health,
		kind: "app-health",
		message: previousApp
			? `${app.name} changed from ${previousLabel} to ${currentLabel}.`
			: `${app.name} first reported with ${currentLabel} status.`,
		occurredAt: observedAt.toISOString(),
		previousHealth,
		serverId: payload.serverId,
		serverName: payload.serverName,
		severity: incidentSeverityForHealth(app.health),
		title: isRecovered
			? `${app.name} recovered`
			: `${app.name} is ${currentLabel.toLowerCase()}`,
	};
};

const createAppRestartIncident = (
	app: AppSnapshot,
	previousApp: AppSnapshot | undefined,
	payload: ServerSnapshotPayload,
	observedAt: Date,
): IncidentEvent | null => {
	const previousRestarts = previousApp?.restarts;
	const currentRestarts = app.restarts;

	if (
		typeof previousRestarts !== "number" ||
		typeof currentRestarts !== "number" ||
		currentRestarts <= previousRestarts
	) {
		return null;
	}

	return {
		id: incidentId(
			payload.serverId,
			"app-restart",
			app.id,
			observedAt,
			String(currentRestarts),
		),
		appId: app.id,
		appName: app.name,
		currentValue: currentRestarts,
		kind: "app-restart",
		message: `${app.name} restart count increased from ${previousRestarts} to ${currentRestarts}.`,
		occurredAt: observedAt.toISOString(),
		previousValue: previousRestarts,
		serverId: payload.serverId,
		serverName: payload.serverName,
		severity: "warning",
		title: `${app.name} restarted`,
	};
};

const createAppAddedIncident = (
	app: AppSnapshot,
	payload: ServerSnapshotPayload,
	observedAt: Date,
): IncidentEvent => {
	const currentLabel = healthLabels[app.health];
	const isHealthy = app.health === "healthy";

	return {
		id: incidentId(
			payload.serverId,
			"app-added",
			app.id,
			observedAt,
			app.health,
		),
		appId: app.id,
		appName: app.name,
		currentHealth: app.health,
		kind: "app-added",
		message: `${app.name} now reports as a ${appKindLabel(app)} app on ${payload.serverName}.`,
		occurredAt: observedAt.toISOString(),
		serverId: payload.serverId,
		serverName: payload.serverName,
		severity: isHealthy ? "info" : incidentSeverityForHealth(app.health),
		title: isHealthy
			? `${app.name} added`
			: `${app.name} added with ${currentLabel.toLowerCase()} status`,
	};
};

const createAppRemovedIncident = (
	app: AppSnapshot,
	payload: ServerSnapshotPayload,
	observedAt: Date,
): IncidentEvent => {
	return {
		id: incidentId(payload.serverId, "app-removed", app.id, observedAt),
		appId: app.id,
		appName: app.name,
		kind: "app-removed",
		message: `${app.name} was present on the previous scan but is missing from the latest snapshot.`,
		occurredAt: observedAt.toISOString(),
		previousHealth: app.health,
		serverId: payload.serverId,
		serverName: payload.serverName,
		severity: "warning",
		title: `${app.name} stopped reporting`,
	};
};

const createIncidentEvents = (
	apps: AppSnapshot[],
	payload: ServerSnapshotPayload,
	previousServer: StoredServer | undefined,
	observedAt: Date,
) => {
	const previousApps = previousServer?.apps ?? [];
	const previousById = new Map(previousApps.map((app) => [app.id, app]));
	const currentById = new Map(apps.map((app) => [app.id, app]));
	const incidents: IncidentEvent[] = [];

	for (const app of apps) {
		const previousApp = previousById.get(app.id);
		const healthIncident =
			previousApp || !previousServer
				? createAppHealthIncident(app, payload, observedAt, previousApp)
				: null;
		const restartIncident = createAppRestartIncident(
			app,
			previousApp,
			payload,
			observedAt,
		);

		if (healthIncident) incidents.push(healthIncident);
		if (restartIncident) incidents.push(restartIncident);

		if (previousServer && !previousApp) {
			incidents.push(createAppAddedIncident(app, payload, observedAt));
		}
	}

	if (previousServer) {
		for (const previousApp of previousApps) {
			if (!currentById.has(previousApp.id)) {
				incidents.push(
					createAppRemovedIncident(previousApp, payload, observedAt),
				);
			}
		}
	}

	return incidents;
};

const withIncidentTimeline = (
	previousIncidents: IncidentEvent[] | undefined,
	incidents: IncidentEvent[],
) => {
	return [...incidents, ...(previousIncidents ?? [])].slice(
		0,
		maxIncidentEvents,
	);
};

const createMetricPoint = (
	apps: AppSnapshot[],
	payload: ServerSnapshotPayload,
	observedAt: Date,
): ServerMetricPoint => {
	const appCpuPercent = apps.reduce(
		(total, app) => total + numberOrZero(app.cpuPercent),
		0,
	);
	const memoryUsedBytes = Math.max(
		0,
		payload.host.memoryTotalBytes - payload.host.memoryFreeBytes,
	);
	const restartCount = apps.reduce(
		(total, app) => total + numberOrZero(app.restarts),
		0,
	);

	return {
		observedAt: observedAt.toISOString(),
		appCpuPercent: Math.round(appCpuPercent * 10) / 10,
		memoryUsedBytes,
		memoryTotalBytes: payload.host.memoryTotalBytes,
		restartCount,
	};
};

const withMetricHistory = (
	previousHistory: ServerMetricPoint[] | undefined,
	point: ServerMetricPoint,
) => {
	return [...(previousHistory ?? []), point].slice(-maxMetricHistoryPoints);
};

const rawString = (app: AppSnapshot | undefined, key: string) => {
	const value = app?.raw?.[key];
	return typeof value === "string" ? value : undefined;
};

const withObservedRestarts = (
	apps: AppSnapshot[],
	previousApps: AppSnapshot[] = [],
) => {
	const previousById = new Map(previousApps.map((app) => [app.id, app]));

	return apps.map((app) => {
		if (app.kind !== "docker") return app;

		const previous = previousById.get(app.id);
		const previousRestarts = previous?.restarts;
		const currentStartedAt = rawString(app, "startedAt");
		const previousStartedAt = rawString(previous, "startedAt");
		let restarts = app.restarts;

		if (
			typeof previousRestarts === "number" &&
			typeof restarts === "number"
		) {
			restarts = Math.max(restarts, previousRestarts);
		}

		if (
			currentStartedAt &&
			previousStartedAt &&
			currentStartedAt !== previousStartedAt
		) {
			restarts = Math.max(restarts ?? 0, (previousRestarts ?? 0) + 1);
		}

		return {
			...app,
			restarts,
		};
	});
};

const withRuntimeStatus = (
	server: StoredServer,
	now: Date,
	offlineAfterMs: number,
): StoredServer => {
	const lastSeenMs = new Date(server.lastSeenAt).getTime();
	const online =
		Number.isFinite(lastSeenMs) &&
		now.getTime() - lastSeenMs <= offlineAfterMs;

	return {
		...server,
		online,
		status: online
			? worstStatus(server.apps.map((app) => app.health))
			: "down",
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
		unknownApps: apps.filter((app) => app.health === "unknown").length,
	};
};

export const createStoredServerFromSnapshot = (
	payload: ServerSnapshotPayload,
	previousServer: StoredServer | undefined,
	receivedAt: Date,
): StoredServer => {
	const apps = sortApps(
		withObservedRestarts(payload.apps, previousServer?.apps),
	);
	const metricPoint = createMetricPoint(apps, payload, receivedAt);
	const incidents = createIncidentEvents(
		apps,
		payload,
		previousServer,
		receivedAt,
	);

	return {
		...payload,
		apps,
		lastSeenAt: receivedAt.toISOString(),
		metricsHistory: withMetricHistory(
			previousServer?.metricsHistory,
			metricPoint,
		),
		incidents: withIncidentTimeline(previousServer?.incidents, incidents),
		online: true,
		status: worstStatus(apps.map((app) => app.health)),
	};
};

export const buildOverview = (
	storedServers: StoredServer[],
	offlineAfterMs: number,
	now = new Date(),
): OverviewResponse => {
	const servers = storedServers
		.map((server) => withRuntimeStatus(server, now, offlineAfterMs))
		.sort((left, right) => left.serverName.localeCompare(right.serverName));

	return {
		generatedAt: now.toISOString(),
		summary: summary(servers),
		servers,
	};
};
