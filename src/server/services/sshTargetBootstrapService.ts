import { createRequire } from "node:module";
import type { Client as SshClient } from "ssh2";
import type {
	SshTarget,
	SshTargetBootstrapInput,
	SshTargetCreateInput,
} from "../../shared/types";
import {
	addKnownHostKey,
	verifyKnownHostKey,
} from "../integrations/ssh/sshKnownHosts";
import { ensureMonitorKeyPair } from "../integrations/ssh/sshMonitorKey";
import {
	connectSshTarget,
	runSshCommand,
} from "../integrations/ssh/sshCommandRunner";
import { errorMessage } from "../lib/errorMessage";
import { shellQuote } from "../lib/shellQuote";
import type { SshTargetConfigService } from "./sshTargetConfigService";

const { Client } = createRequire(import.meta.url)(
	"ssh2",
) as typeof import("ssh2");

type PasswordTarget = Pick<
	SshTargetBootstrapInput,
	"host" | "port" | "username"
>;

const connectWithPassword = (
	target: PasswordTarget,
	password: string,
	timeoutMs: number,
): Promise<{ client: SshClient; hostKey: Buffer }> => {
	return new Promise((resolve, reject) => {
		const client = new Client();
		let hostKey: Buffer | null = null;
		let hostKeyRejection = "";

		const cleanup = () => {
			clearTimeout(timer);
			client.off("ready", onReady);
			client.off("error", onError);
		};

		const onReady = () => {
			cleanup();

			if (!hostKey) {
				client.end();
				reject(new Error("SSH server did not provide a host key."));
				return;
			}

			resolve({ client, hostKey });
		};

		const onError = (error: Error) => {
			cleanup();
			client.end();
			reject(new Error(hostKeyRejection || error.message));
		};

		const timer = setTimeout(() => {
			cleanup();
			client.end();
			reject(
				new Error(`SSH password setup timed out after ${timeoutMs}ms`),
			);
		}, timeoutMs);

		client.once("ready", onReady);
		client.once("error", onError);
		client.connect({
			host: target.host,
			port: target.port,
			username: target.username,
			password,
			readyTimeout: timeoutMs,
			tryKeyboard: false,
			hostVerifier: (key: Buffer) => {
				hostKey = Buffer.from(key);

				const verification = verifyKnownHostKey(target, key);
				if (verification.trusted) return true;

				if (
					verification.status === "missing-file" ||
					verification.status === "not-found"
				) {
					return true;
				}

				hostKeyRejection = verification.message || "";
				return false;
			},
		});
	});
};

const installPublicKeyCommand = (publicKey: string) => {
	const quotedPublicKey = shellQuote(publicKey);

	return [
		"umask 077",
		"mkdir -p ~/.ssh",
		"touch ~/.ssh/authorized_keys",
		`(grep -qxF ${quotedPublicKey} ~/.ssh/authorized_keys || printf '%s\\n' ${quotedPublicKey} >> ~/.ssh/authorized_keys)`,
		"chmod 700 ~/.ssh",
		"chmod 600 ~/.ssh/authorized_keys",
	].join(" && ");
};

const targetForKeyTest = (input: SshTargetCreateInput): SshTarget => {
	const now = new Date().toISOString();

	return {
		id: "__bootstrap__",
		createdAt: now,
		updatedAt: now,
		...input,
		enabled: input.enabled ?? true,
	};
};

export class SshTargetBootstrapService {
	constructor(
		private readonly sshTargetConfigService: SshTargetConfigService,
		private readonly sshCommandTimeoutMs: () => number,
	) {}

	async bootstrapTarget(input: SshTargetBootstrapInput) {
		const sshCommandTimeoutMs = this.sshCommandTimeoutMs();
		const keyPair = await ensureMonitorKeyPair();
		const passwordConnection = await connectWithPassword(
			input,
			input.password,
			sshCommandTimeoutMs,
		);

		try {
			const installResult = await runSshCommand(
				passwordConnection.client,
				installPublicKeyCommand(keyPair.publicKey),
				sshCommandTimeoutMs,
			);

			if (!installResult.ok) {
				const output = [
					installResult.stderr.trim(),
					installResult.stdout.trim(),
				]
					.filter(Boolean)
					.join("\n");
				throw new Error(
					`Failed to install monitor public key.${output ? ` ${output}` : ""}`,
				);
			}
		} finally {
			passwordConnection.client.end();
		}

		addKnownHostKey(input, passwordConnection.hostKey);

		const createInput: SshTargetCreateInput = {
			name: input.name,
			host: input.host,
			port: input.port,
			username: input.username,
			privateKeyPath: keyPair.privateKeyPath,
			enabled: input.enabled,
		};
		const keyTestTarget = targetForKeyTest(createInput);
		const keyClient = await connectSshTarget(
			keyTestTarget,
			sshCommandTimeoutMs,
		);

		try {
			const keyTestResult = await runSshCommand(
				keyClient,
				"echo ok",
				sshCommandTimeoutMs,
			);
			if (!keyTestResult.ok) {
				throw new Error(
					`Monitor key test failed: ${keyTestResult.stderr || keyTestResult.stdout}`,
				);
			}
		} catch (error) {
			throw new Error(
				`Monitor key was installed, but key login failed: ${errorMessage(error)}`,
			);
		} finally {
			keyClient.end();
		}

		return this.sshTargetConfigService.createTarget(createInput);
	}
}
