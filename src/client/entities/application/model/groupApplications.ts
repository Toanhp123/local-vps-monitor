import type {
	AppGroupSource,
	AppKind,
	AppSnapshot,
	HealthStatus,
} from "@shared/types";
import { isIgnoredApp } from "./appPolicy";

export interface ApplicationGroupView {
	apps: AppSnapshot[];
	dockerCount: number;
	id: string;
	name: string;
	pm2Count: number;
	source: AppGroupSource;
	status: HealthStatus;
}

const statusRank: Record<HealthStatus, number> = {
	down: 4,
	warning: 3,
	unknown: 2,
	healthy: 1,
};

export const appGroupSourceLabels: Record<AppGroupSource, string> = {
	"docker-compose": "Docker Compose",
	docker: "Docker",
	pm2: "PM2",
};

const runtimeGroup = (kind: AppKind) => {
	if (kind === "docker") {
		return {
			id: "runtime:docker",
			name: "Docker containers",
			source: "docker" as const,
		};
	}

	return {
		id: "runtime:pm2",
		name: "PM2 processes",
		source: "pm2" as const,
	};
};

const groupStatus = (apps: AppSnapshot[]) => {
	const monitoredApps = apps.filter((app) => !isIgnoredApp(app));
	if (monitoredApps.length === 0) return "healthy";

	return monitoredApps.reduce<HealthStatus>((current, app) => {
		return statusRank[app.health] > statusRank[current]
			? app.health
			: current;
	}, "healthy");
};

export const groupApplications = (apps: AppSnapshot[]) => {
	const groups = new Map<string, ApplicationGroupView>();

	for (const app of apps) {
		const group = app.group || runtimeGroup(app.kind);
		const current = groups.get(group.id);

		if (current) {
			current.apps.push(app);
			current.dockerCount += app.kind === "docker" ? 1 : 0;
			current.pm2Count += app.kind === "pm2" ? 1 : 0;
			current.status = groupStatus(current.apps);
			continue;
		}

		groups.set(group.id, {
			apps: [app],
			dockerCount: app.kind === "docker" ? 1 : 0,
			id: group.id,
			name: group.name,
			pm2Count: app.kind === "pm2" ? 1 : 0,
			source: group.source,
			status: app.health,
		});
	}

	return Array.from(groups.values()).sort((first, second) => {
		if (statusRank[second.status] !== statusRank[first.status]) {
			return statusRank[second.status] - statusRank[first.status];
		}

		return first.name.localeCompare(second.name);
	});
};
