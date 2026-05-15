import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type {
	SshTarget,
	SshTargetCreateInput,
	SshTargetUpdateInput,
} from "../../shared/types";

interface SshTargetState {
	targets: Record<string, SshTarget>;
}

const emptyState = (): SshTargetState => ({ targets: {} });

const normalizeTargetInput = (input: SshTargetCreateInput) => ({
	name: input.name.trim(),
	host: input.host.trim(),
	port: input.port,
	username: input.username.trim(),
	privateKeyPath: input.privateKeyPath.trim(),
	enabled: input.enabled ?? true,
});

const normalizeTargetUpdateInput = (input: SshTargetUpdateInput) => ({
	...(input.name !== undefined ? { name: input.name.trim() } : {}),
	...(input.host !== undefined ? { host: input.host.trim() } : {}),
	...(input.port !== undefined ? { port: input.port } : {}),
	...(input.username !== undefined
		? { username: input.username.trim() }
		: {}),
	...(input.privateKeyPath !== undefined
		? { privateKeyPath: input.privateKeyPath.trim() }
		: {}),
	...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
});

export class SshTargetConfigStore {
	private state: SshTargetState;

	constructor(private readonly filePath: string) {
		this.state = this.load();
	}

	list() {
		return Object.values(this.state.targets).sort((left, right) => {
			return left.name.localeCompare(right.name);
		});
	}

	get(targetId: string) {
		return this.state.targets[targetId];
	}

	create(input: SshTargetCreateInput) {
		const now = new Date().toISOString();
		const normalized = normalizeTargetInput(input);
		const target: SshTarget = {
			id: `ssh-${crypto.randomUUID()}`,
			...normalized,
			createdAt: now,
			updatedAt: now,
		};

		this.state.targets[target.id] = target;
		this.save();

		return target;
	}

	createMany(inputs: SshTargetCreateInput[]) {
		const targets = inputs.map((input) => {
			const now = new Date().toISOString();
			const normalized = normalizeTargetInput(input);

			return {
				id: `ssh-${crypto.randomUUID()}`,
				...normalized,
				createdAt: now,
				updatedAt: now,
			} satisfies SshTarget;
		});

		for (const target of targets) {
			this.state.targets[target.id] = target;
		}

		this.save();

		return targets;
	}

	update(targetId: string, input: SshTargetUpdateInput) {
		const current = this.state.targets[targetId];
		if (!current) return null;

		const target: SshTarget = {
			...current,
			...normalizeTargetUpdateInput(input),
			updatedAt: new Date().toISOString(),
		};

		this.state.targets[targetId] = target;
		this.save();

		return target;
	}

	delete(targetId: string) {
		if (!this.state.targets[targetId]) return false;

		delete this.state.targets[targetId];
		this.save();

		return true;
	}

	private load(): SshTargetState {
		if (!fs.existsSync(this.filePath)) return emptyState();

		try {
			const raw = fs.readFileSync(this.filePath, "utf8");
			const parsed = JSON.parse(raw) as SshTargetState;
			return parsed && parsed.targets ? parsed : emptyState();
		} catch (error) {
			console.warn(`Cannot read SSH targets at ${this.filePath}:`, error);
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
