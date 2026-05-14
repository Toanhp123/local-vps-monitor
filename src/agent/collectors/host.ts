import os from "node:os";
import type { HostMetrics } from "../../shared/types";

export const collectHostMetrics = (): HostMetrics => {
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    uptimeSeconds: os.uptime(),
    loadAverage: os.loadavg(),
    cpuCount: os.cpus().length,
    memoryTotalBytes: os.totalmem(),
    memoryFreeBytes: os.freemem()
  };
};
