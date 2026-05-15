import { runLocalCommand } from "./localCommandRunner";

const combineLogStreams = (stdout: string, stderr: string) => {
	return [stdout, stderr]
		.map((value) => value.trimEnd())
		.filter(Boolean)
		.join("\n");
};

export const readLocalDockerLogs = async (
	containerRef: string,
	lines: number,
	timeoutMs: number,
) => {
	const result = await runLocalCommand(
		"docker",
		["logs", "--tail", String(lines), "--timestamps", containerRef],
		timeoutMs,
	);
	const content = combineLogStreams(result.stdout, result.stderr);

	if (!result.ok) {
		throw new Error(content || "Docker logs command failed");
	}

	return content;
};
