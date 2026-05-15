import type {
	AppSnapshot,
	DiskMetrics,
	HealthStatus,
	StoredServer,
} from "../../../../shared/types";
import { diskHealthStatus } from "./diskUsagePolicy";

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

export const serverHealthStatus = (
	apps: AppSnapshot[],
	disk: DiskMetrics | undefined,
) => {
	const statuses = apps.map((app) => app.health);
	if (disk) statuses.push(diskHealthStatus(disk));

	return worstStatus(statuses);
};

export const withRuntimeStatus = (
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
			? serverHealthStatus(server.apps, server.host.disk)
			: "down",
	};
};
