import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Client } from "ssh2";
import type { SshTarget } from "../../../shared/types";
import { errorMessage } from "../../lib/errorMessage";

export interface SshCommandResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  code?: number;
}

const expandHomePath = (filePath: string) => {
  if (filePath === "~") return os.homedir();

  if (filePath.startsWith("~/") || filePath.startsWith("~\\")) {
    return path.join(os.homedir(), filePath.slice(2));
  }

  return filePath;
};

const resolvePrivateKeyPath = (filePath: string) => {
  const expanded = expandHomePath(filePath);
  return path.isAbsolute(expanded) ? expanded : path.resolve(process.cwd(), expanded);
};

export const connectSshTarget = (target: SshTarget, timeoutMs: number) => {
  return new Promise<Client>((resolve, reject) => {
    let privateKey: Buffer;

    try {
      privateKey = fs.readFileSync(resolvePrivateKeyPath(target.privateKeyPath));
    } catch (error) {
      reject(new Error(`Cannot read private key file: ${errorMessage(error)}`));
      return;
    }

    const client = new Client();
    const timer = setTimeout(() => {
      cleanup();
      client.end();
      reject(new Error(`SSH connection timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timer);
      client.off("ready", onReady);
      client.off("error", onError);
    };

    const onReady = () => {
      cleanup();
      resolve(client);
    };

    const onError = (error: Error) => {
      cleanup();
      client.end();
      reject(error);
    };

    client.once("ready", onReady);
    client.once("error", onError);
    client.connect({
      host: target.host,
      port: target.port,
      username: target.username,
      privateKey,
      readyTimeout: timeoutMs,
      tryKeyboard: false
    });
  });
};

export const runSshCommand = (client: Client, command: string, timeoutMs: number) => {
  return new Promise<SshCommandResult>((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      settled = true;
      reject(new Error(`Remote command timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    client.exec(command, (error, stream) => {
      if (settled) return;

      if (error) {
        clearTimeout(timer);
        settled = true;
        reject(error);
        return;
      }

      stream.on("data", (chunk: Buffer) => {
        stdout += chunk.toString("utf8");
      });

      stream.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString("utf8");
      });

      stream.on("close", (code: number | null) => {
        if (settled) return;

        clearTimeout(timer);
        settled = true;
        resolve({
          ok: code === 0,
          stdout,
          stderr,
          code: code ?? undefined
        });
      });
    });
  });
};

export const safeRunSshCommand = async (
  client: Client,
  command: string,
  timeoutMs: number
): Promise<SshCommandResult> => {
  try {
    return await runSshCommand(client, command, timeoutMs);
  } catch (error) {
    return {
      ok: false,
      stdout: "",
      stderr: errorMessage(error)
    };
  }
};
