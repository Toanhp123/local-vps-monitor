import type { AppSnapshot } from "../../../../shared/types";

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

export const normalizeAppSnapshots = (
	apps: AppSnapshot[],
	previousApps?: AppSnapshot[],
) => {
	return sortApps(withObservedRestarts(apps, previousApps));
};
