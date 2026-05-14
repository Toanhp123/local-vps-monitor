import type { AppSnapshot } from "../../../shared/types";
import {
	buildDockerApps,
	buildDockerInspectMetadata,
	extractDockerContainerRefs,
	type DockerInspectRow,
	type DockerPsRow,
	type DockerStatsRow,
} from "../docker/dockerAppsParser";
import { runLocalCommand } from "./localCommandRunner";

const parseJsonLines = <T>(raw: string): T[] => {
	return raw
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean)
		.flatMap((line) => {
			try {
				return [JSON.parse(line) as T];
			} catch {
				return [];
			}
		});
};

const dockerError = (stderr: string) => {
	const message = stderr.trim();

	if (message.includes("ENOENT")) {
		return "Docker CLI was not found on this machine";
	}

	if (/cannot connect|is the docker daemon running/i.test(message)) {
		return "Docker is not running on this machine";
	}

	return message || "Docker command failed";
};

const runDockerCommand = async (args: string[], timeoutMs: number) => {
	const result = await runLocalCommand("docker", args, timeoutMs);
	if (result.ok) return result;

	throw new Error(dockerError(result.stderr));
};

export const collectLocalDockerApps = async (
	timeoutMs: number,
): Promise<AppSnapshot[]> => {
	const psResult = await runDockerCommand(
		["ps", "-a", "--format", "{{json .}}"],
		timeoutMs,
	);
	if (!psResult.stdout.trim()) return [];

	const containers = parseJsonLines<DockerPsRow>(psResult.stdout);
	const containerRefs = extractDockerContainerRefs(containers);

	const [statsResult, inspectResult] = await Promise.all([
		runDockerCommand(
			["stats", "--no-stream", "--format", "{{json .}}"],
			timeoutMs,
		).catch(() => ({
			ok: false,
			stdout: "",
			stderr: "",
		})),
		containerRefs.length > 0
			? runDockerCommand(
					["inspect", "--format", "{{json .}}", ...containerRefs],
					timeoutMs,
				).catch(() => ({
					ok: false,
					stdout: "",
					stderr: "",
				}))
			: Promise.resolve({ ok: true, stdout: "", stderr: "" }),
	]);

	const stats = statsResult.ok
		? parseJsonLines<DockerStatsRow>(statsResult.stdout)
		: [];
	const inspectMetadata = inspectResult.ok
		? buildDockerInspectMetadata(
				parseJsonLines<DockerInspectRow>(inspectResult.stdout),
			)
		: new Map();

	return buildDockerApps(containers, stats, inspectMetadata);
};
