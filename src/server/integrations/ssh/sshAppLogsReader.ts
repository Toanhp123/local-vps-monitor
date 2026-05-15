import type { Client } from "ssh2";
import type { AppSnapshot } from "../../../shared/types";
import { dockerContainerRef, pm2ProcessRef } from "../../domain/appRuntimeRefs";
import { shellQuote } from "../../lib/shellQuote";
import { stripAnsi } from "../../lib/stripAnsi";
import { runSshCommand } from "./sshCommandRunner";

const combineLogStreams = (stdout: string, stderr: string) => {
	return [stdout, stderr]
		.map((value) => value.trimEnd())
		.filter(Boolean)
		.join("\n");
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
