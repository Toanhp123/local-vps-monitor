import type { Client } from "ssh2";
import type { AppSnapshot } from "../../../shared/types";
import { runSshCommand } from "./sshCommandRunner";

const shellQuote = (value: string) => {
	return `'${value.replace(/'/g, "'\\''")}'`;
};

const stripAnsi = (value: string) => {
	return value.replace(/\u001b\[[0-9;]*m/g, "");
};

const combineLogStreams = (stdout: string, stderr: string) => {
	return [stdout, stderr]
		.map((value) => value.trimEnd())
		.filter(Boolean)
		.join("\n");
};

const dockerContainerRef = (app: AppSnapshot) => {
	const rawDockerId = app.raw?.dockerId;
	if (typeof rawDockerId === "string" && rawDockerId.trim()) {
		return rawDockerId.trim();
	}

	return app.id.replace(/^docker:/, "");
};

const pm2ProcessRef = (app: AppSnapshot) => {
	const rawPmId = app.raw?.pmId;
	if (typeof rawPmId === "number" && Number.isInteger(rawPmId)) {
		return String(rawPmId);
	}

	if (typeof rawPmId === "string" && rawPmId.trim()) {
		return rawPmId.trim();
	}

	return app.id.replace(/^pm2:/, "");
};

export const readSshAppLogs = async (
	client: Client,
	app: AppSnapshot,
	lines: number,
	timeoutMs: number,
) => {
	const command =
		app.kind === "docker"
			? `docker logs --tail ${lines} --timestamps ${shellQuote(dockerContainerRef(app))} 2>&1`
			: `pm2 logs ${shellQuote(pm2ProcessRef(app))} --lines ${lines} --nostream 2>&1`;
	const result = await runSshCommand(client, command, timeoutMs);
	const content = stripAnsi(combineLogStreams(result.stdout, result.stderr));

	if (!result.ok) {
		throw new Error(content || "Remote logs command failed");
	}

	return content;
};
