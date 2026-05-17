import type {
	DiskMetrics,
	HealthStatus,
	HostMetrics,
	IncidentSeverity,
	ServerAlertPolicy,
	ServerAlertThresholds,
} from "../../../../shared/types";

export const defaultServerAlertThresholds: ServerAlertThresholds = {
	cpuLoadCriticalPercent: 95,
	cpuLoadWarningPercent: 80,
	diskCriticalPercent: 90,
	diskWarningPercent: 80,
	memoryCriticalPercent: 95,
	memoryWarningPercent: 85,
};

export const defaultServerAlertPolicy: ServerAlertPolicy = {
	defaults: defaultServerAlertThresholds,
	serverOverrides: {},
};

export const resolveServerAlertThresholds = (
	serverAlertPolicy: ServerAlertPolicy = defaultServerAlertPolicy,
	serverId?: string,
) => {
	if (!serverId) return serverAlertPolicy.defaults;

	return serverAlertPolicy.serverOverrides[serverId] ?? serverAlertPolicy.defaults;
};

export type ResourceUsageState = "healthy" | "warning" | "critical";

const usageState = (
	value: number | undefined,
	warningThreshold: number,
	criticalThreshold: number,
): ResourceUsageState | undefined => {
	if (value === undefined || !Number.isFinite(value)) return undefined;
	if (value >= criticalThreshold) return "critical";
	if (value >= warningThreshold) return "warning";

	return "healthy";
};

export const memoryUsedPercent = (host: HostMetrics | undefined) => {
	if (!host || host.memoryTotalBytes <= 0) return undefined;

	const usedBytes = Math.max(0, host.memoryTotalBytes - host.memoryFreeBytes);
	return Math.round((usedBytes / host.memoryTotalBytes) * 1000) / 10;
};

export const cpuLoadPercent = (host: HostMetrics | undefined) => {
	const loadAverage = host?.loadAverage[0];
	if (
		!host ||
		typeof loadAverage !== "number" ||
		!Number.isFinite(loadAverage) ||
		host.cpuCount <= 0
	) {
		return undefined;
	}

	return Math.round((loadAverage / host.cpuCount) * 1000) / 10;
};

export const diskUsageState = (
	disk: DiskMetrics | undefined,
	thresholds: ServerAlertThresholds = defaultServerAlertThresholds,
) => {
	return usageState(
		disk?.usedPercent,
		thresholds.diskWarningPercent,
		thresholds.diskCriticalPercent,
	);
};

export const memoryUsageState = (
	host: HostMetrics | undefined,
	thresholds: ServerAlertThresholds = defaultServerAlertThresholds,
) => {
	return usageState(
		memoryUsedPercent(host),
		thresholds.memoryWarningPercent,
		thresholds.memoryCriticalPercent,
	);
};

export const cpuLoadState = (
	host: HostMetrics | undefined,
	thresholds: ServerAlertThresholds = defaultServerAlertThresholds,
) => {
	return usageState(
		cpuLoadPercent(host),
		thresholds.cpuLoadWarningPercent,
		thresholds.cpuLoadCriticalPercent,
	);
};

export const resourceHealthStatus = (
	state: ResourceUsageState | undefined,
): HealthStatus => {
	return state === "warning" || state === "critical"
		? "warning"
		: "healthy";
};

export const resourceIncidentSeverity = (
	state: ResourceUsageState,
): IncidentSeverity => {
	if (state === "critical") return "critical";
	if (state === "warning") return "warning";

	return "resolved";
};

export const diskLabel = (disk: DiskMetrics) => `Disk ${disk.mount || "/"}`;
