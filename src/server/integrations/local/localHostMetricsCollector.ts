import os from "node:os";
import path from "node:path";
import type { HostMetrics } from "../../../shared/types";
import {
	parseDfRootDisk,
	parseWindowsLogicalDisk,
} from "../system/diskMetricsParser";
import { runLocalCommand } from "./localCommandRunner";

const collectWindowsRootDisk = async (timeoutMs: number) => {
	const mount = path.parse(process.cwd()).root.replace(/\\$/, "");
	const result = await runLocalCommand(
		"powershell.exe",
		[
			"-NoProfile",
			"-NonInteractive",
			"-Command",
			`$disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='${mount}'"; if ($disk) { "$($disk.DeviceID) $($disk.Size) $($disk.FreeSpace)" }`,
		],
		timeoutMs,
	);

	return result.ok ? parseWindowsLogicalDisk(result.stdout, mount) : undefined;
};

const collectUnixRootDisk = async (timeoutMs: number) => {
	const result = await runLocalCommand("df", ["-Pk", "/"], timeoutMs);

	return result.ok ? parseDfRootDisk(result.stdout) : undefined;
};

export const collectLocalHostMetrics = async (
	timeoutMs: number,
): Promise<HostMetrics> => {
	const disk =
		process.platform === "win32"
			? await collectWindowsRootDisk(timeoutMs)
			: await collectUnixRootDisk(timeoutMs);

	return {
		hostname: os.hostname() || "local-machine",
		platform: os.platform(),
		arch: os.arch(),
		uptimeSeconds: os.uptime(),
		loadAverage: os.loadavg(),
		cpuCount: Math.max(1, os.cpus().length),
		memoryTotalBytes: os.totalmem(),
		memoryFreeBytes: os.freemem(),
		disk,
	};
};
