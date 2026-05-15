import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const monitorKeyName = "vps_monitor";
const publicKeyPrefixPattern = /^(ssh-|ecdsa-|sk-)/;

export interface MonitorKeyPair {
	privateKeyPath: string;
	publicKey: string;
}

const defaultPrivateKeyPath = () => {
	return path.join(os.homedir(), ".ssh", monitorKeyName);
};

const readPublicKey = (publicKeyPath: string) => {
	const publicKey = fs.readFileSync(publicKeyPath, "utf8").trim();

	if (!publicKeyPrefixPattern.test(publicKey)) {
		throw new Error(`Monitor public key is invalid: ${publicKeyPath}`);
	}

	return publicKey;
};

const writePublicKeyFromPrivateKey = async (
	privateKeyPath: string,
	publicKeyPath: string,
) => {
	const { stdout } = await execFileAsync(
		"ssh-keygen",
		["-y", "-f", privateKeyPath],
		{
			encoding: "utf8",
			timeout: 12_000,
			windowsHide: true,
		},
	);

	const publicKey = stdout.trim();
	if (!publicKeyPrefixPattern.test(publicKey)) {
		throw new Error(
			`Cannot derive monitor public key from ${privateKeyPath}`,
		);
	}

	fs.writeFileSync(publicKeyPath, `${publicKey}\n`, {
		mode: 0o600,
	});

	if (process.platform !== "win32") {
		fs.chmodSync(publicKeyPath, 0o600);
	}

	return publicKey;
};

export const ensureMonitorKeyPair = async (): Promise<MonitorKeyPair> => {
	const privateKeyPath = defaultPrivateKeyPath();
	const publicKeyPath = `${privateKeyPath}.pub`;
	const keyDir = path.dirname(privateKeyPath);

	fs.mkdirSync(keyDir, { recursive: true });

	if (!fs.existsSync(privateKeyPath)) {
		if (fs.existsSync(publicKeyPath)) {
			throw new Error(
				`Monitor public key exists without private key: ${publicKeyPath}`,
			);
		}

		await execFileAsync(
			"ssh-keygen",
			[
				"-t",
				"ed25519",
				"-f",
				privateKeyPath,
				"-N",
				"",
				"-C",
				"vps-monitor",
			],
			{
				encoding: "utf8",
				timeout: 12_000,
				windowsHide: true,
			},
		);
	}

	if (process.platform !== "win32") {
		fs.chmodSync(privateKeyPath, 0o600);
	}

	const publicKey = fs.existsSync(publicKeyPath)
		? readPublicKey(publicKeyPath)
		: await writePublicKeyFromPrivateKey(privateKeyPath, publicKeyPath);

	return {
		privateKeyPath,
		publicKey,
	};
};
