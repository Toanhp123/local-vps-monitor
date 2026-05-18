import crypto from "node:crypto";
import type {
	SshTarget,
	SshTargetCreateInput,
	SshTargetUpdateInput,
} from "../../shared/types";
import { ConfigDocumentStore } from "./database/configDocumentStore";

interface SshTargetState {
	targets: Record<string, SshTarget>;
}

const configKey = "ssh_targets";
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

	constructor(private readonly documents: ConfigDocumentStore) {
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
		const persisted = this.documents.get<SshTargetState>(configKey);
		if (persisted?.targets) return persisted;

		const state = emptyState();
		this.documents.set(configKey, state);
		return state;
	}

	private save() {
		this.documents.set(configKey, this.state);
	}
}
