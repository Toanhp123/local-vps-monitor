import type {
	AppSnapshot,
	ServerMetricPoint,
	ServerSnapshotPayload,
} from "../../../../shared/types";

const numberOrZero = (value: number | undefined) => {
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

export const createServerMetricPoint = (
	apps: AppSnapshot[],
	payload: ServerSnapshotPayload,
	observedAt: Date,
): ServerMetricPoint => {
	const appCpuPercent = apps.reduce(
		(total, app) => total + numberOrZero(app.cpuPercent),
		0,
	);
	const memoryUsedBytes = Math.max(
		0,
		payload.host.memoryTotalBytes - payload.host.memoryFreeBytes,
	);
	const restartCount = apps.reduce(
		(total, app) => total + numberOrZero(app.restarts),
		0,
	);
	const disk = payload.host.disk;

	return {
		observedAt: observedAt.toISOString(),
		appCpuPercent: Math.round(appCpuPercent * 10) / 10,
		...(disk
			? {
					diskTotalBytes: disk.totalBytes,
					diskUsedBytes: disk.usedBytes,
					diskUsedPercent: disk.usedPercent,
				}
			: {}),
		memoryUsedBytes,
		memoryTotalBytes: payload.host.memoryTotalBytes,
		restartCount,
	};
};
