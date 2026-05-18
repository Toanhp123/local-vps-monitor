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

const configFilePath = ({
	defaultPath,
	envName,
	legacyDefaultPath,
	legacyEnvName,
}: {
	defaultPath: string;
	envName: string;
	legacyDefaultPath?: string;
	legacyEnvName?: string;
}) => {
	const configuredPath =
		process.env[envName] ||
		(legacyEnvName ? process.env[legacyEnvName] : undefined);

	if (configuredPath) return path.resolve(process.cwd(), configuredPath);

	const resolvedDefaultPath = path.resolve(process.cwd(), defaultPath);
	if (!legacyDefaultPath) return resolvedDefaultPath;

	const resolvedLegacyDefaultPath = path.resolve(
		process.cwd(),
		legacyDefaultPath,
	);
	return !fs.existsSync(resolvedDefaultPath) &&
		fs.existsSync(resolvedLegacyDefaultPath)
		? resolvedLegacyDefaultPath
		: resolvedDefaultPath;
};

export const serverConfig = {
	port: numberFromEnv("PORT", 3101),
	host: process.env.HOST || "127.0.0.1",
	version: process.env.npm_package_version || "0.1.0",
	legacyMonitorStateFile: path.resolve(
		process.cwd(),
		process.env.MONITOR_STATE_FILE ||
			process.env.DATA_FILE ||
			"./data/monitor-state.json",
	),
	legacySshTargetsFile: path.resolve(
		process.cwd(),
		process.env.SSH_TARGETS_FILE || "./data/ssh-targets.json",
	),
	legacyHttpChecksFile: path.resolve(
		process.cwd(),
		process.env.HTTP_CHECKS_FILE || "./data/http-checks.json",
	),
	legacyAppPoliciesFile: configFilePath({
		defaultPath: "./data/app-policies.json",
		envName: "APP_POLICIES_FILE",
		legacyDefaultPath: "./data/app-monitor-rules.json",
		legacyEnvName: "APP_MONITOR_RULES_FILE",
	}),
	legacyServerAlertPolicyFile: configFilePath({
		defaultPath: "./data/server-alert-policy.json",
		envName: "SERVER_ALERT_POLICY_FILE",
		legacyDefaultPath: "./data/alert-policy.json",
		legacyEnvName: "ALERT_POLICY_FILE",
	}),
	legacyIncidentStateFile: configFilePath({
		defaultPath: "./data/incident-state.json",
		envName: "INCIDENT_STATE_FILE",
		legacyDefaultPath: "./data/incident-actions.json",
		legacyEnvName: "INCIDENT_ACTIONS_FILE",
	}),
	legacyMonitorRuntimeFile: configFilePath({
		defaultPath: "./data/monitor-runtime.json",
		envName: "MONITOR_RUNTIME_FILE",
		legacyDefaultPath: "./data/system-settings.json",
		legacyEnvName: "SYSTEM_SETTINGS_FILE",
	}),
	offlineAfterMs: numberFromEnv("OFFLINE_AFTER_MS", 60_000),
	realtimeBroadcastMs: numberFromEnv("REALTIME_BROADCAST_MS", 5_000),
	autoScanIntervalMs: numberFromEnv("AUTO_SCAN_INTERVAL_MS", 60_000),
	defaultAppLogLines: numberFromEnv("DEFAULT_APP_LOG_LINES", 200),
	httpCheckConcurrency: numberFromEnv("HTTP_CHECK_CONCURRENCY", 8),
	incidentHistoryLimit: numberFromEnv("INCIDENT_HISTORY_LIMIT", 100),
	metricHistoryLimit: numberFromEnv("METRIC_HISTORY_LIMIT", 60),
	sshScanConcurrency: numberFromEnv("SSH_SCAN_CONCURRENCY", 4),
	sshCommandTimeoutMs: numberFromEnv("SSH_COMMAND_TIMEOUT_MS", 12_000),
	localDockerCommandTimeoutMs: numberFromEnv(
		"LOCAL_DOCKER_COMMAND_TIMEOUT_MS",
		12_000,
	),
	databaseFile: path.resolve(
		process.cwd(),
		process.env.DATABASE_FILE || "./data/monitor.db",
	),
	metricsRetentionDays: numberFromEnv("METRICS_RETENTION_DAYS", 30),
	incidentsRetentionDays: numberFromEnv("INCIDENTS_RETENTION_DAYS", 90),
	dataRetentionEnabled: process.env.DATA_RETENTION_ENABLED !== "false",
	sshPoolMaxConnections: numberFromEnv("SSH_POOL_MAX_CONNECTIONS", 50),
	sshPoolConnectionTimeout: numberFromEnv("SSH_POOL_CONNECTION_TIMEOUT", 10_000),
	sshPoolIdleTimeout: numberFromEnv("SSH_POOL_IDLE_TIMEOUT", 60_000),
};
