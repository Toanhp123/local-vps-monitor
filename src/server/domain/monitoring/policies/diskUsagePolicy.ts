import type {
	DiskMetrics,
	HealthStatus,
	IncidentSeverity,
} from "../../../../shared/types";

const diskWarningPercent = 80;
const diskCriticalPercent = 90;

export type DiskUsageState = "healthy" | "warning" | "critical";

export const diskUsageState = (
	disk: DiskMetrics | undefined,
): DiskUsageState | undefined => {
	if (!disk) return undefined;
	if (disk.usedPercent >= diskCriticalPercent) return "critical";
	if (disk.usedPercent >= diskWarningPercent) return "warning";

	return "healthy";
};

export const diskHealthStatus = (
	disk: DiskMetrics | undefined,
): HealthStatus => {
	const state = diskUsageState(disk);

	return state === "warning" || state === "critical"
		? "warning"
		: "healthy";
};

export const diskIncidentSeverity = (
	state: DiskUsageState,
): IncidentSeverity => {
	if (state === "critical") return "critical";
	if (state === "warning") return "warning";

	return "resolved";
};

export const diskLabel = (disk: DiskMetrics) => `Disk ${disk.mount || "/"}`;
