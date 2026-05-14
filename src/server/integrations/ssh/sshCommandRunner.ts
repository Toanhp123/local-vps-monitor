import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import type { Client as SshClient } from "ssh2";
import type { SshTarget } from "../../../shared/types";
import { errorMessage } from "../../lib/errorMessage";
import { verifyKnownHostKey } from "./sshKnownHosts";

const { Client, utils } = createRequire(import.meta.url)("ssh2") as typeof import("ssh2");

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

const validatePrivateKeyPathValue = (filePath: string) => {
  const trimmed = filePath.trim();

  if (trimmed.includes("\n") || trimmed.startsWith("-----BEGIN ") || trimmed.startsWith("ssh-")) {
    throw new Error("Private key path must be a local file path, not pasted key content.");
  }
};

const readPrivateKey = (filePath: string) => {
  validatePrivateKeyPathValue(filePath);

  const resolvedPath = resolvePrivateKeyPath(filePath);
  let privateKey: Buffer;

  try {
    privateKey = fs.readFileSync(resolvedPath);
  } catch (error) {
    throw new Error(`Cannot read private key file: ${errorMessage(error)}`);
  }

  const parsedKey = utils.parseKey(privateKey);
  if (parsedKey instanceof Error) {
    throw new Error(
      `Private key file is not a valid SSH private key. Use the private key file path, not the .pub file. ${parsedKey.message}`
    );
  }

  if (!parsedKey.isPrivateKey()) {
    throw new Error("Private key file points to a public key. Use the private key file path without the .pub suffix.");
  }

  return privateKey;
};

export const connectSshTarget = (target: SshTarget, timeoutMs: number) => {
  return new Promise<SshClient>((resolve, reject) => {
    let privateKey: Buffer;

    try {
      privateKey = readPrivateKey(target.privateKeyPath);
    } catch (error) {
      reject(error);
      return;
    }

    const client = new Client();
    let hostKeyRejection = "";
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
      reject(new Error(hostKeyRejection || error.message));
    };

    client.once("ready", onReady);
    client.once("error", onError);
    client.connect({
      host: target.host,
      port: target.port,
      username: target.username,
      privateKey,
      readyTimeout: timeoutMs,
      tryKeyboard: false,
      hostVerifier: (key: Buffer) => {
        const verification = verifyKnownHostKey(target, key);
        hostKeyRejection = verification.message || "";

        return verification.trusted;
      }
    });
  });
};

export const runSshCommand = (client: SshClient, command: string, timeoutMs: number) => {
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
  client: SshClient,
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
