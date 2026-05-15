import type { Client } from "ssh2";
import type { HostMetrics } from "../../../shared/types";
import { safeRunSshCommand } from "./sshCommandRunner";
import { firstLine, parseNumber } from "./sshOutputParsers";

const parseLoadAverage = (raw: string) => {
	const values = firstLine(raw, "0 0 0")
		.split(/\s+/)
		.slice(0, 3)
		.map((value) => parseNumber(value));

	while (values.length < 3) values.push(0);
	return values;
};

const parseMemInfo = (raw: string) => {
	const values = new Map<string, number>();

	for (const line of raw.split(/\r?\n/)) {
		const match = line.match(/^([A-Za-z_()]+):\s+(\d+)/);
		if (!match) continue;

		values.set(match[1], Number(match[2]) * 1024);
	}

	return {
		total: values.get("MemTotal") ?? 0,
		free: values.get("MemAvailable") ?? values.get("MemFree") ?? 0,
	};
};

export const collectSshHostMetrics = async (
	client: Client,
	timeoutMs: number,
): Promise<HostMetrics> => {
	const [hostname, platform, arch, uptime, cpuCount, loadAverage, memInfo] =
		await Promise.all([
			safeRunSshCommand(
				client,
				"hostname 2>/dev/null || uname -n 2>/dev/null || echo unknown",
				timeoutMs,
			),
			safeRunSshCommand(
				client,
				"uname -s 2>/dev/null || echo linux",
				timeoutMs,
			),
			safeRunSshCommand(
				client,
				"uname -m 2>/dev/null || echo unknown",
				timeoutMs,
			),
			safeRunSshCommand(
				client,
				"cat /proc/uptime 2>/dev/null || echo 0",
				timeoutMs,
			),
			safeRunSshCommand(
				client,
				"nproc 2>/dev/null || getconf _NPROCESSORS_ONLN 2>/dev/null || echo 1",
				timeoutMs,
			),
			safeRunSshCommand(
				client,
				"cat /proc/loadavg 2>/dev/null || echo '0 0 0'",
				timeoutMs,
			),
			safeRunSshCommand(
				client,
				"cat /proc/meminfo 2>/dev/null || true",
				timeoutMs,
			),
		]);
	const memory = parseMemInfo(memInfo.stdout);

	return {
		hostname: firstLine(hostname.stdout, "unknown"),
		platform: firstLine(platform.stdout, "linux").toLowerCase(),
		arch: firstLine(arch.stdout, "unknown"),
		uptimeSeconds: parseNumber(firstLine(uptime.stdout).split(/\s+/)[0], 0),
		loadAverage: parseLoadAverage(loadAverage.stdout),
		cpuCount: Math.max(
			1,
			Math.round(parseNumber(firstLine(cpuCount.stdout), 1)),
		),
		memoryTotalBytes: memory.total,
		memoryFreeBytes: memory.free,
	};
};
