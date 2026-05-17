import type {
	AppSnapshot,
	DiskMetrics,
	HealthStatus,
	HostMetrics,
	ServerAlertThresholds,
	StoredServer,
} from "../../../../shared/types";
import { isMonitoredApp } from "../applications/appPolicy";
import {
	cpuLoadState,
	diskUsageState,
	memoryUsageState,
	resourceHealthStatus,
} from "./serverResourcePolicy";

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
	hostOrDisk: HostMetrics | DiskMetrics | undefined,
	thresholds?: ServerAlertThresholds,
) => {
	const statuses = apps
		.filter(isMonitoredApp)
		.map((app) => app.health);

	if (hostOrDisk && "memoryTotalBytes" in hostOrDisk) {
		statuses.push(resourceHealthStatus(diskUsageState(hostOrDisk.disk, thresholds)));
		statuses.push(resourceHealthStatus(memoryUsageState(hostOrDisk, thresholds)));
		statuses.push(resourceHealthStatus(cpuLoadState(hostOrDisk, thresholds)));
	} else {
		statuses.push(resourceHealthStatus(diskUsageState(hostOrDisk, thresholds)));
	}

	if (statuses.length === 0 && apps.length > 0) return "healthy";

	return worstStatus(statuses);
};

export const withRuntimeStatus = (
	server: StoredServer,
	now: Date,
	offlineAfterMs: number,
	thresholds?: ServerAlertThresholds,
): StoredServer => {
	const lastSeenMs = new Date(server.lastSeenAt).getTime();
	const online =
		Number.isFinite(lastSeenMs) &&
		now.getTime() - lastSeenMs <= offlineAfterMs;

	return {
		...server,
		online,
		status: online
			? serverHealthStatus(server.apps, server.host, thresholds)
			: "down",
	};
};
