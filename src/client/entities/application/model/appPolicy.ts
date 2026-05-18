import type { AppImportance, AppSnapshot } from "@shared/types";

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
