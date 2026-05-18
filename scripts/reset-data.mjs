import fs from "node:fs";
import path from "node:path";

const loadDotEnv = (filePath) => {
	if (!fs.existsSync(filePath)) return;

	for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
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

const resolvePath = (value) => path.resolve(process.cwd(), value);
loadDotEnv(resolvePath(".env"));

const databaseFile = resolvePath(
	process.env.DATABASE_FILE || "./data/monitor.db",
);
const legacyFiles = [
	process.env.MONITOR_STATE_FILE ||
		process.env.DATA_FILE ||
		"./data/monitor-state.json",
	process.env.SSH_TARGETS_FILE || "./data/ssh-targets.json",
	process.env.HTTP_CHECKS_FILE || "./data/http-checks.json",
	process.env.APP_POLICIES_FILE || "./data/app-policies.json",
	process.env.APP_MONITOR_RULES_FILE || "./data/app-monitor-rules.json",
	process.env.SERVER_ALERT_POLICY_FILE || "./data/server-alert-policy.json",
	process.env.ALERT_POLICY_FILE || "./data/alert-policy.json",
	process.env.INCIDENT_STATE_FILE || "./data/incident-state.json",
	process.env.INCIDENT_ACTIONS_FILE || "./data/incident-actions.json",
	process.env.MONITOR_RUNTIME_FILE || "./data/monitor-runtime.json",
	process.env.SYSTEM_SETTINGS_FILE || "./data/system-settings.json",
].map(resolvePath);

const removeIfExists = (filePath) => {
	if (!fs.existsSync(filePath)) return false;

	fs.rmSync(filePath, { force: true });
	return true;
};

const removed = [
	databaseFile,
	`${databaseFile}-wal`,
	`${databaseFile}-shm`,
	...new Set(legacyFiles),
].filter(removeIfExists);

if (removed.length === 0) {
	console.log("No local monitor data found to reset.");
} else {
	console.log("Removed local monitor data:");
	for (const filePath of removed) {
		console.log(`- ${filePath}`);
	}
}
