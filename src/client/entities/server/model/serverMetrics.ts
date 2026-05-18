import type { StoredServer } from "@shared/types";
import { monitoredApps } from "@/entities/application";

export const serverMemory = (server: StoredServer) => {
	const used = Math.max(
		0,
		server.host.memoryTotalBytes - server.host.memoryFreeBytes,
	);
	const percent = server.host.memoryTotalBytes
		? Math.round((used / server.host.memoryTotalBytes) * 100)
		: 0;

	return { used, percent };
};

export const serverDisk = (server: StoredServer) => {
	const disk = server.host.disk;
	if (!disk) return undefined;

	return {
		available: disk.availableBytes,
		percent: Math.round(disk.usedPercent),
		total: disk.totalBytes,
		used: disk.usedBytes,
	};
};

export const serverAppCounts = (server: StoredServer) => {
	const monitoredAppsList = monitoredApps(server.apps);
	const healthyApps = monitoredAppsList.filter((app) => app.health !== "down");

	return {
		ignored: server.apps.length - monitoredAppsList.length,
		monitored: healthyApps.length,
		total: monitoredAppsList.length,
	};
};
