import os from "node:os";
import type { HostMetrics } from "../../../shared/types";

export const collectLocalHostMetrics = (): HostMetrics => {
	return {
		hostname: os.hostname() || "local-machine",
		platform: os.platform(),
		arch: os.arch(),
		uptimeSeconds: os.uptime(),
		loadAverage: os.loadavg(),
		cpuCount: Math.max(1, os.cpus().length),
		memoryTotalBytes: os.totalmem(),
		memoryFreeBytes: os.freemem(),
	};
};
