import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type {
	HttpCheck,
	HttpCheckCreateInput,
	HttpCheckResult,
	HttpCheckUpdateInput,
} from "../../shared/types";

interface HttpCheckState {
	checks: Record<string, HttpCheck>;
}

const emptyState = (): HttpCheckState => ({ checks: {} });

const defaultMethod = "GET";
const defaultExpectedStatusMin = 200;
const defaultExpectedStatusMax = 399;
const defaultTimeoutMs = 5_000;

const normalizeText = (value: string | undefined) => {
	const trimmed = value?.trim();
	return trimmed || undefined;
};

const normalizeCreateInput = (input: HttpCheckCreateInput) => ({
	appId: normalizeText(input.appId),
	enabled: input.enabled ?? true,
	expectedStatusMax:
		input.expectedStatusMax ?? defaultExpectedStatusMax,
	expectedStatusMin:
		input.expectedStatusMin ?? defaultExpectedStatusMin,
	method: input.method ?? defaultMethod,
	name: input.name.trim(),
	serverId: normalizeText(input.serverId),
	timeoutMs: input.timeoutMs ?? defaultTimeoutMs,
	url: input.url.trim(),
});

const normalizeUpdateInput = (input: HttpCheckUpdateInput) => ({
	...(input.appId !== undefined
		? { appId: normalizeText(input.appId) }
		: {}),
	...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
	...(input.expectedStatusMax !== undefined
		? { expectedStatusMax: input.expectedStatusMax }
		: {}),
	...(input.expectedStatusMin !== undefined
		? { expectedStatusMin: input.expectedStatusMin }
		: {}),
	...(input.method !== undefined ? { method: input.method } : {}),
	...(input.name !== undefined ? { name: input.name.trim() } : {}),
	...(input.serverId !== undefined
		? { serverId: normalizeText(input.serverId) }
		: {}),
	...(input.timeoutMs !== undefined ? { timeoutMs: input.timeoutMs } : {}),
	...(input.url !== undefined ? { url: input.url.trim() } : {}),
});

export class HttpCheckConfigStore {
	private state: HttpCheckState;

	constructor(private readonly filePath: string) {
		this.state = this.load();
	}

	list() {
		return Object.values(this.state.checks).sort((left, right) => {
			return left.name.localeCompare(right.name);
		});
	}

	get(checkId: string) {
		return this.state.checks[checkId];
	}

	create(input: HttpCheckCreateInput) {
		const now = new Date().toISOString();
		const check: HttpCheck = {
			id: `http-${crypto.randomUUID()}`,
			...normalizeCreateInput(input),
			createdAt: now,
			updatedAt: now,
		};

		this.state.checks[check.id] = check;
		this.save();

		return check;
	}

	update(checkId: string, input: HttpCheckUpdateInput) {
		const current = this.state.checks[checkId];
		if (!current) return null;

		const check: HttpCheck = {
			...current,
			...normalizeUpdateInput(input),
			updatedAt: new Date().toISOString(),
		};

		this.state.checks[checkId] = check;
		this.save();

		return check;
	}

	updateResult(checkId: string, result: HttpCheckResult) {
		const current = this.state.checks[checkId];
		if (!current) return null;

		const check: HttpCheck = {
			...current,
			lastResult: result,
			updatedAt: new Date().toISOString(),
		};

		this.state.checks[checkId] = check;
		this.save();

		return check;
	}

	delete(checkId: string) {
		if (!this.state.checks[checkId]) return false;

		delete this.state.checks[checkId];
		this.save();

		return true;
	}

	private load(): HttpCheckState {
		if (!fs.existsSync(this.filePath)) return emptyState();

		try {
			const raw = fs.readFileSync(this.filePath, "utf8");
			const parsed = JSON.parse(raw) as HttpCheckState;
			return parsed && parsed.checks ? parsed : emptyState();
		} catch (error) {
			console.warn(`Cannot read HTTP checks at ${this.filePath}:`, error);
			return emptyState();
		}
	}

	private save() {
		fs.mkdirSync(path.dirname(this.filePath), { recursive: true });

		const tempPath = `${this.filePath}.tmp`;
		fs.writeFileSync(tempPath, JSON.stringify(this.state, null, 2), {
			mode: 0o600,
		});
		fs.renameSync(tempPath, this.filePath);

		if (process.platform !== "win32") {
			fs.chmodSync(this.filePath, 0o600);
		}
	}
}
