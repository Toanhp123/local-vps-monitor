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

const removeIfExists = (filePath) => {
	if (!fs.existsSync(filePath)) return false;

	fs.rmSync(filePath, { force: true });
	return true;
};

const removed = [
	databaseFile,
	`${databaseFile}-wal`,
	`${databaseFile}-shm`,
].filter(removeIfExists);

if (removed.length === 0) {
	console.log("No local monitor data found to reset.");
} else {
	console.log("Removed local monitor data:");
	for (const filePath of removed) {
		console.log(`- ${filePath}`);
	}
}
