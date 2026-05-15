import type {
	OverviewResponse,
	OverviewSummary,
	ServerSnapshotPayload,
	StoredServer,
} from "../../../shared/types";
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
	const apps = normalizeAppSnapshots(payload.apps, previousServer?.apps);
	const metricPoint = createServerMetricPoint(apps, payload, receivedAt);
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
