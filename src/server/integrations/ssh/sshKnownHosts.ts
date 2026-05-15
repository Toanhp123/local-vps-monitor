import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { SshTarget } from "../../../shared/types";

type KnownHostTarget = Pick<SshTarget, "host" | "port">;

interface KnownHostEntry {
	marker?: string;
	hostPatterns: string;
	keyType: string;
	encodedKey: string;
}

export interface KnownHostVerification {
	status: "trusted" | "missing-file" | "not-found" | "mismatch" | "revoked";
	trusted: boolean;
	message?: string;
}

const expandHomePath = (filePath: string) => {
	if (filePath === "~") return os.homedir();

	if (filePath.startsWith("~/") || filePath.startsWith("~\\")) {
		return path.join(os.homedir(), filePath.slice(2));
	}

	return filePath;
};

export const resolveKnownHostsPath = () => {
	return path.join(os.homedir(), ".ssh", "known_hosts");
};

const keyFingerprint = (key: Buffer) => {
	return `SHA256:${crypto.createHash("sha256").update(key).digest("base64").replace(/=+$/g, "")}`;
};

const parseKnownHostLine = (line: string): KnownHostEntry | null => {
	const trimmed = line.trim();
	if (!trimmed || trimmed.startsWith("#")) return null;

	const parts = trimmed.split(/\s+/);
	const hasMarker = parts[0]?.startsWith("@");
	const markerOffset = hasMarker ? 1 : 0;

	const hostPatterns = parts[markerOffset];
	const keyType = parts[markerOffset + 1];
	const encodedKey = parts[markerOffset + 2];

	if (!hostPatterns || !keyType || !encodedKey) return null;

	return {
		marker: hasMarker ? parts[0] : undefined,
		hostPatterns,
		keyType,
		encodedKey,
	};
};

const wildcardPatternToRegExp = (pattern: string) => {
	const escaped = pattern
		.replace(/[.+^${}()|[\]\\]/g, "\\$&")
		.replace(/\*/g, ".*")
		.replace(/\?/g, ".");
	return new RegExp(`^${escaped}$`, "i");
};

const hashedKnownHostMatches = (pattern: string, candidates: string[]) => {
	const [, version, encodedSalt, encodedHash] = pattern.split("|");
	if (version !== "1" || !encodedSalt || !encodedHash) return false;

	const salt = Buffer.from(encodedSalt, "base64");
	const expectedHash = Buffer.from(encodedHash, "base64");

	return candidates.some((candidate) => {
		const actualHash = crypto
			.createHmac("sha1", salt)
			.update(candidate)
			.digest();

		return (
			actualHash.length === expectedHash.length &&
			crypto.timingSafeEqual(actualHash, expectedHash)
		);
	});
};

const hostPatternMatches = (hostPatterns: string, candidates: string[]) => {
	let matched = false;

	for (const rawPattern of hostPatterns.split(",")) {
		const negated = rawPattern.startsWith("!");
		const pattern = (
			negated ? rawPattern.slice(1) : rawPattern
		).toLowerCase();
		const isMatch = pattern.startsWith("|1|")
			? hashedKnownHostMatches(pattern, candidates)
			: candidates.some((candidate) =>
					wildcardPatternToRegExp(pattern).test(candidate),
				);

		if (negated && isMatch) return false;
		if (isMatch) matched = true;
	}

	return matched;
};

const targetHostCandidates = (target: KnownHostTarget) => {
	const host = target.host.trim().toLowerCase();

	return Array.from(new Set([host, `[${host}]:${target.port}`]));
};

const knownHostPatternForTarget = (target: KnownHostTarget) => {
	const host = target.host.trim().toLowerCase();
	return target.port === 22 ? host : `[${host}]:${target.port}`;
};

const keyTypeFromBlob = (key: Buffer) => {
	if (key.length < 4) return "ssh-ed25519";

	const typeLength = key.readUInt32BE(0);
	const typeStart = 4;
	const typeEnd = typeStart + typeLength;

	if (typeLength <= 0 || typeEnd > key.length) return "ssh-ed25519";

	const keyType = key.toString("utf8", typeStart, typeEnd);
	return /^[A-Za-z0-9._@-]+$/.test(keyType) ? keyType : "ssh-ed25519";
};

export const verifyKnownHostKey = (
	target: KnownHostTarget,
	key: Buffer,
): KnownHostVerification => {
	const knownHostsPath = resolveKnownHostsPath();
	const fingerprint = keyFingerprint(key);

	if (!fs.existsSync(knownHostsPath)) {
		return {
			status: "missing-file",
			trusted: false,
			message: `SSH host key is not trusted because ${knownHostsPath} does not exist. Add the VPS host key first, for example: ssh-keyscan -p ${target.port} ${target.host} >> ~/.ssh/known_hosts. Remote key: ${fingerprint}`,
		};
	}

	const candidates = targetHostCandidates(target);
	const lines = fs
		.readFileSync(expandHomePath(knownHostsPath), "utf8")
		.split(/\r?\n/);
	let hostMatched = false;

	for (const line of lines) {
		const entry = parseKnownHostLine(line);
		if (!entry || !hostPatternMatches(entry.hostPatterns, candidates))
			continue;

		hostMatched = true;

		if (entry.marker === "@cert-authority") continue;

		if (entry.marker === "@revoked") {
			return {
				status: "revoked",
				trusted: false,
				message: `SSH host key for ${target.host} is revoked in ${knownHostsPath}.`,
			};
		}

		const trustedKey = Buffer.from(entry.encodedKey, "base64");
		if (
			trustedKey.length === key.length &&
			crypto.timingSafeEqual(trustedKey, key)
		) {
			return { status: "trusted", trusted: true };
		}
	}

	return {
		status: hostMatched ? "mismatch" : "not-found",
		trusted: false,
		message: hostMatched
			? `SSH host key mismatch for ${target.host}. The remote key does not match ${knownHostsPath}. Remote key: ${fingerprint}`
			: `SSH host key is not trusted for ${target.host}. Add the VPS host key first, for example: ssh-keyscan -p ${target.port} ${target.host} >> ~/.ssh/known_hosts. Remote key: ${fingerprint}`,
	};
};

export const addKnownHostKey = (target: KnownHostTarget, key: Buffer) => {
	const verification = verifyKnownHostKey(target, key);
	if (verification.trusted) return;

	if (
		verification.status === "mismatch" ||
		verification.status === "revoked"
	) {
		throw new Error(verification.message);
	}

	const knownHostsPath = resolveKnownHostsPath();
	fs.mkdirSync(path.dirname(knownHostsPath), { recursive: true });
	const needsLineBreak =
		fs.existsSync(knownHostsPath) &&
		fs.statSync(knownHostsPath).size > 0 &&
		!fs.readFileSync(knownHostsPath, "utf8").endsWith("\n");
	fs.appendFileSync(
		knownHostsPath,
		`${needsLineBreak ? "\n" : ""}${knownHostPatternForTarget(target)} ${keyTypeFromBlob(key)} ${key.toString("base64")}\n`,
		{
			mode: 0o600,
		},
	);

	if (process.platform !== "win32") {
		fs.chmodSync(knownHostsPath, 0o600);
	}
};
