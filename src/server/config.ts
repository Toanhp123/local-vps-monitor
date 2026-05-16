import fs from "node:fs";
import path from "node:path";

const loadDotEnv = (filePath: string) => {
	if (!fs.existsSync(filePath)) return;

	const raw = fs.readFileSync(filePath, "utf8");

	for (const line of raw.split(/\r?\n/)) {
		const trimmed = line.trim();

		if (!trimmed || trimmed.startsWith("#")) continue;

		const separatorIndex = trimmed.indexOf("=");
		if (separatorIndex <= 0) continue;

		const key = trimmed.slice(0, separatorIndex).trim();
		const value = trimmed.slice(separatorIndex + 1).trim();

		if (
			!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) ||
			process.env[key] !== undefined
		) {
			continue;
		}

		process.env[key] = value.replace(/^(['"])(.*)\1$/, "$2");
	}
};

loadDotEnv(path.resolve(process.cwd(), ".env"));

const numberFromEnv = (name: string, fallback: number) => {
	const raw = process.env[name];
	if (!raw) return fallback;

	const parsed = Number(raw);
	return Number.isFinite(parsed) ? parsed : fallback;
};

export const serverConfig = {
	port: numberFromEnv("PORT", 3101),
	host: process.env.HOST || "127.0.0.1",
	version: process.env.npm_package_version || "0.1.0",
	dataFile: path.resolve(
		process.cwd(),
		process.env.DATA_FILE || "./data/monitor-state.json",
	),
	sshTargetsFile: path.resolve(
		process.cwd(),
		process.env.SSH_TARGETS_FILE || "./data/ssh-targets.json",
	),
	httpChecksFile: path.resolve(
		process.cwd(),
		process.env.HTTP_CHECKS_FILE || "./data/http-checks.json",
	),
	appMonitorRulesFile: path.resolve(
		process.cwd(),
		process.env.APP_MONITOR_RULES_FILE || "./data/app-monitor-rules.json",
	),
	offlineAfterMs: numberFromEnv("OFFLINE_AFTER_MS", 60_000),
	realtimeBroadcastMs: numberFromEnv("REALTIME_BROADCAST_MS", 5_000),
	autoScanIntervalMs: numberFromEnv("AUTO_SCAN_INTERVAL_MS", 60_000),
	httpCheckConcurrency: numberFromEnv("HTTP_CHECK_CONCURRENCY", 8),
	sshScanConcurrency: numberFromEnv("SSH_SCAN_CONCURRENCY", 4),
	sshCommandTimeoutMs: numberFromEnv("SSH_COMMAND_TIMEOUT_MS", 12_000),
	localDockerCommandTimeoutMs: numberFromEnv(
		"LOCAL_DOCKER_COMMAND_TIMEOUT_MS",
		12_000,
	),
};
