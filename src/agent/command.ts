import { execFile } from "node:child_process";

export interface CommandResult {
  ok: boolean;
  stdout: string;
  stderr: string;
}

export const runCommand = (command: string, args: string[], timeoutMs = 5_000): Promise<CommandResult> => {
  return new Promise((resolve) => {
    execFile(command, args, { timeout: timeoutMs, windowsHide: true }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        stdout: String(stdout || ""),
        stderr: String(stderr || error?.message || "")
      });
    });
  });
};
