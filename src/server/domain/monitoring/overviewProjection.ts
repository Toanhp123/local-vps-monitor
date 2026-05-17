import type {
	ServerAlertPolicy,
	OverviewResponse,
	OverviewSummary,
	ServerSnapshotPayload,
	StoredServer,
	AppPolicy,
} from "../../../shared/types";
import {
	appImportance,
	applyEffectiveAppPolicy,
	applyServerAppPolicy,
	isMonitoredApp,
} from "./applications/appPolicy";
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
import {
	defaultServerAlertPolicy,
	resolveServerAlertThresholds,
} from "./policies/serverResourcePolicy";

interface OverviewProjectionOptions {
	incidentHistoryLimit?: number;
	metricHistoryLimit?: number;
}

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
	appPolicies: AppPolicy[] = [],
	serverAlertPolicy: ServerAlertPolicy = defaultServerAlertPolicy,
	options: OverviewProjectionOptions = {},
): StoredServer => {
	const alertThresholds = resolveServerAlertThresholds(
		serverAlertPolicy,
		payload.serverId,
	);
	const apps = applyEffectiveAppPolicy(
		normalizeAppSnapshots(payload.apps, previousServer?.apps),
		appPolicies,
		payload.serverId,
	);
	const previousServerWithPolicy = previousServer
		? applyServerAppPolicy(previousServer, appPolicies)
		: undefined;
	const metricPoint = createServerMetricPoint(apps, payload, receivedAt);
	const incidents = createIncidentEvents(
		apps,
		payload,
		previousServerWithPolicy,
		receivedAt,
		alertThresholds,
	);

	return {
		...payload,
		apps,
		lastSeenAt: receivedAt.toISOString(),
		metricsHistory: appendMetricHistory(
			previousServer?.metricsHistory,
			metricPoint,
			options.metricHistoryLimit,
		),
		incidents: appendIncidentTimeline(
			previousServer?.incidents,
			incidents,
			options.incidentHistoryLimit,
		),
		online: true,
		status: serverHealthStatus(apps, payload.host, alertThresholds),
	};
};

export const buildOverview = (
	storedServers: StoredServer[],
	offlineAfterMs: number,
	now = new Date(),
	appPolicies: AppPolicy[] = [],
	serverAlertPolicy: ServerAlertPolicy = defaultServerAlertPolicy,
): OverviewResponse => {
	const servers = storedServers
		.map((server) =>
			withRuntimeStatus(
				applyServerAppPolicy(server, appPolicies),
				now,
				offlineAfterMs,
				resolveServerAlertThresholds(serverAlertPolicy, server.serverId),
			),
		)
		.sort((left, right) => left.serverName.localeCompare(right.serverName));

	return {
		generatedAt: now.toISOString(),
		summary: summary(servers),
		servers,
	};
};
