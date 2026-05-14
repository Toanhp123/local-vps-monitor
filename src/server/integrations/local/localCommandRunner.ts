import { execFile } from "node:child_process";

export interface LocalCommandResult {
	ok: boolean;
	stdout: string;
	stderr: string;
}

export const runLocalCommand = (
	file: string,
	args: string[],
	timeoutMs: number,
): Promise<LocalCommandResult> => {
	return new Promise((resolve) => {
		execFile(
			file,
			args,
			{
				encoding: "utf8",
				maxBuffer: 5 * 1024 * 1024,
				timeout: timeoutMs,
				windowsHide: true,
			},
			(error, stdout, stderr) => {
				resolve({
					ok: !error,
					stdout: stdout || "",
					stderr: stderr || (error ? error.message : ""),
				});
			},
		);
	});
};
