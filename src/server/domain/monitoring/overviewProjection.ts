import type {
	OverviewResponse,
	OverviewSummary,
	ServerSnapshotPayload,
	StoredServer,
	AppMonitorRule,
} from "../../../shared/types";
import {
	appImportance,
	applyAppMonitoringPolicy,
	applyServerMonitoringPolicy,
	isMonitoredApp,
} from "./applications/appMonitoringPolicy";
import { normalizeAppSnapshots } from "./applications/applicationSnapshots";
import {
	appendIncidentTimeline,
	createIncidentEvents,
} from "./incidents/incidentTimeline";
import {
	appendMetricHistory,
	createServerMetricPoint,
} from "./metrics/serverMetricHistory";
import {
	serverHealthStatus,
	withRuntimeStatus,
} from "./policies/serverHealthPolicy";

const summary = (servers: StoredServer[]): OverviewSummary => {
	const apps = servers.flatMap((server) => server.apps);
	const monitoredApps = apps.filter(isMonitoredApp);

	return {
		totalServers: servers.length,
		onlineServers: servers.filter((server) => server.online).length,
		totalApps: apps.length,
		monitoredApps: monitoredApps.length,
		ignoredApps: apps.length - monitoredApps.length,
		criticalApps: monitoredApps.filter(
			(app) => appImportance(app) === "critical",
		).length,
		healthyApps: monitoredApps.filter((app) => app.health === "healthy")
			.length,
		warningApps: monitoredApps.filter((app) => app.health === "warning")
			.length,
		downApps: monitoredApps.filter((app) => app.health === "down").length,
		unknownApps: monitoredApps.filter((app) => app.health === "unknown")
			.length,
	};
};

export const createStoredServerFromSnapshot = (
	payload: ServerSnapshotPayload,
	previousServer: StoredServer | undefined,
	receivedAt: Date,
	appMonitorRules: AppMonitorRule[] = [],
): StoredServer => {
	const apps = applyAppMonitoringPolicy(
		normalizeAppSnapshots(payload.apps, previousServer?.apps),
		appMonitorRules,
		payload.serverId,
	);
	const previousServerWithPolicy = previousServer
		? applyServerMonitoringPolicy(previousServer, appMonitorRules)
		: undefined;
	const metricPoint = createServerMetricPoint(apps, payload, receivedAt);
	const incidents = createIncidentEvents(
		apps,
		payload,
		previousServerWithPolicy,
		receivedAt,
	);

	return {
		...payload,
		apps,
		lastSeenAt: receivedAt.toISOString(),
		metricsHistory: appendMetricHistory(
			previousServer?.metricsHistory,
			metricPoint,
		),
		incidents: appendIncidentTimeline(
			previousServer?.incidents,
			incidents,
		),
		online: true,
		status: serverHealthStatus(apps, payload.host.disk),
	};
};

export const buildOverview = (
	storedServers: StoredServer[],
	offlineAfterMs: number,
	now = new Date(),
	appMonitorRules: AppMonitorRule[] = [],
): OverviewResponse => {
	const servers = storedServers
		.map((server) =>
			withRuntimeStatus(
				applyServerMonitoringPolicy(server, appMonitorRules),
				now,
				offlineAfterMs,
			),
		)
		.sort((left, right) => left.serverName.localeCompare(right.serverName));

	return {
		generatedAt: now.toISOString(),
		summary: summary(servers),
		servers,
	};
};
