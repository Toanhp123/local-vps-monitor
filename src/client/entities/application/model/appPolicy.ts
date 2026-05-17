import type {
	AppImportance,
	AppSnapshot,
	OverviewSummary,
	StoredServer,
} from "@shared/types";

export const appImportance = (app: AppSnapshot): AppImportance => {
	return app.monitoring?.importance ?? "normal";
};

export const appDisplayName = (app: AppSnapshot) => {
	return app.monitoring?.displayName?.trim() || app.name;
};

export const isIgnoredApp = (app: AppSnapshot) => {
	return appImportance(app) === "ignored";
};

export const monitoredApps = (apps: AppSnapshot[]) => {
	return apps.filter((app) => !isIgnoredApp(app));
};

export const serverAppCounts = (server: StoredServer) => {
	const monitored = monitoredApps(server.apps).length;

	return {
		ignored: server.apps.length - monitored,
		monitored,
		total: server.apps.length,
	};
};

export const summaryMonitoredApps = (summary: OverviewSummary | undefined) => {
	return summary?.monitoredApps ?? summary?.totalApps ?? 0;
};
