import type {
	AppSnapshot,
	HealthStatus,
	IncidentEvent,
	IncidentSeverity,
	ServerSnapshotPayload,
} from "../../../../shared/types";
import {
	appDisplayName,
	appImportance,
	isIgnoredApp,
} from "../applications/appPolicy";
import { createIncidentId } from "./incidentIds";

const healthLabels: Record<HealthStatus, string> = {
	down: "Down",
	warning: "Warning",
	unknown: "Unknown",
	healthy: "Healthy",
};

const incidentSeverityForHealth = (
	health: HealthStatus,
	importance = "normal",
): IncidentSeverity => {
	if (health === "healthy") return "resolved";
	if (health === "down") {
		return importance === "critical" ? "critical" : "warning";
	}
	if (health === "warning") return "warning";

	return "warning";
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
	const appName = appDisplayName(app);
	const importance = appImportance(app);

	return {
		id: createIncidentId(
			payload.serverId,
			"app-health",
			app.id,
			observedAt,
			app.health,
		),
		appId: app.id,
		appName,
		currentHealth: app.health,
		kind: "app-health",
		message: previousApp
			? `${appName} changed from ${previousLabel} to ${currentLabel}.`
			: `${appName} first reported with ${currentLabel} status.`,
		occurredAt: observedAt.toISOString(),
		previousHealth,
		serverId: payload.serverId,
		serverName: payload.serverName,
		severity: incidentSeverityForHealth(app.health, importance),
		title: isRecovered
			? `${appName} recovered`
			: `${appName} is ${currentLabel.toLowerCase()}`,
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
	const appName = appDisplayName(app);

	return {
		id: createIncidentId(
			payload.serverId,
			"app-restart",
			app.id,
			observedAt,
			String(currentRestarts),
		),
		appId: app.id,
		appName,
		currentValue: currentRestarts,
		kind: "app-restart",
		message: `${appName} restart count increased from ${previousRestarts} to ${currentRestarts}.`,
		occurredAt: observedAt.toISOString(),
		previousValue: previousRestarts,
		serverId: payload.serverId,
		serverName: payload.serverName,
		severity: "warning",
		title: `${appName} restarted`,
	};
};

const createAppAddedIncident = (
	app: AppSnapshot,
	payload: ServerSnapshotPayload,
	observedAt: Date,
): IncidentEvent => {
	const currentLabel = healthLabels[app.health];
	const isHealthy = app.health === "healthy";
	const appName = appDisplayName(app);
	const importance = appImportance(app);

	return {
		id: createIncidentId(
			payload.serverId,
			"app-added",
			app.id,
			observedAt,
			app.health,
		),
		appId: app.id,
		appName,
		currentHealth: app.health,
		kind: "app-added",
		message: `${appName} now reports as a ${appKindLabel(app)} app on ${payload.serverName}.`,
		occurredAt: observedAt.toISOString(),
		serverId: payload.serverId,
		serverName: payload.serverName,
		severity: isHealthy
			? "info"
			: incidentSeverityForHealth(app.health, importance),
		title: isHealthy
			? `${appName} added`
			: `${appName} added with ${currentLabel.toLowerCase()} status`,
	};
};

const createAppRemovedIncident = (
	app: AppSnapshot,
	payload: ServerSnapshotPayload,
	observedAt: Date,
): IncidentEvent => {
	const appName = appDisplayName(app);
	const importance = appImportance(app);

	return {
		id: createIncidentId(
			payload.serverId,
			"app-removed",
			app.id,
			observedAt,
		),
		appId: app.id,
		appName,
		kind: "app-removed",
		message: `${appName} was present on the previous scan but is missing from the latest snapshot.`,
		occurredAt: observedAt.toISOString(),
		previousHealth: app.health,
		serverId: payload.serverId,
		serverName: payload.serverName,
		severity: importance === "critical" ? "critical" : "warning",
		title: `${appName} stopped reporting`,
	};
};

export const createAppIncidentEvents = ({
	apps,
	observedAt,
	payload,
	previousApps,
	previousServerExists,
}: {
	apps: AppSnapshot[];
	observedAt: Date;
	payload: ServerSnapshotPayload;
	previousApps: AppSnapshot[];
	previousServerExists: boolean;
}) => {
	const previousById = new Map(previousApps.map((app) => [app.id, app]));
	const currentById = new Map(apps.map((app) => [app.id, app]));
	const incidents: IncidentEvent[] = [];

	for (const app of apps) {
		if (isIgnoredApp(app)) continue;

		const previousApp = previousById.get(app.id);
		const healthIncident =
			previousApp || !previousServerExists
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

		if (previousServerExists && !previousApp) {
			incidents.push(createAppAddedIncident(app, payload, observedAt));
		}
	}

	if (previousServerExists) {
		for (const previousApp of previousApps) {
			if (!currentById.has(previousApp.id) && !isIgnoredApp(previousApp)) {
				incidents.push(
					createAppRemovedIncident(previousApp, payload, observedAt),
				);
			}
		}
	}

	return incidents;
};
