import crypto from "node:crypto";
import type {
	AppPolicyOverrideInput,
	AppPolicy,
	AppPolicyCreateInput,
	AppPolicyUpdateInput,
} from "../../shared/types";
import { ConfigDocumentStore } from "./database/configDocumentStore";

interface AppPolicyState {
	policies: Record<string, AppPolicy>;
	rules?: Record<string, AppPolicy>;
}

const configKey = "app_policies";
const emptyState = (): AppPolicyState => ({ policies: {} });

const normalizeState = (state: unknown): AppPolicyState => {
	if (!state || typeof state !== "object") return emptyState();

	const parsed = state as AppPolicyState;
	if (parsed.policies) return { policies: parsed.policies };
	if (parsed.rules) return { policies: parsed.rules };

	return emptyState();
};

const normalizeText = (value: string | undefined) => {
	const trimmed = value?.trim();
	return trimmed || undefined;
};

const normalizeCreateInput = (input: AppPolicyCreateInput) => ({
	appKind: input.appKind,
	displayName: normalizeText(input.displayName),
	enabled: input.enabled ?? true,
	importance: input.importance,
	match: input.match.trim(),
	matchMode: input.matchMode ?? "contains",
	name: input.name.trim(),
	serverId: normalizeText(input.serverId),
});

const normalizeUpdateInput = (input: AppPolicyUpdateInput) => ({
	...(input.appKind !== undefined ? { appKind: input.appKind } : {}),
	...(input.displayName !== undefined
		? { displayName: normalizeText(input.displayName) }
		: {}),
	...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
	...(input.importance !== undefined ? { importance: input.importance } : {}),
	...(input.match !== undefined ? { match: input.match.trim() } : {}),
	...(input.matchMode !== undefined ? { matchMode: input.matchMode } : {}),
	...(input.name !== undefined ? { name: input.name.trim() } : {}),
	...(input.serverId !== undefined
		? { serverId: normalizeText(input.serverId) }
		: {}),
});

const isDirectAppOverride = (
	policy: AppPolicy,
	serverId: string,
	appId: string,
) => {
	return policy.serverId === serverId && policy.appId === appId;
};

export class AppPolicyStore {
	private state: AppPolicyState;

	constructor(private readonly documents: ConfigDocumentStore) {
		this.state = this.load();
	}

	list() {
		return Object.values(this.state.policies).sort((left, right) => {
			const serverCompare = (left.serverId || "").localeCompare(
				right.serverId || "",
			);
			if (serverCompare !== 0) return serverCompare;

			return left.name.localeCompare(right.name);
		});
	}

	get(policyId: string) {
		return this.state.policies[policyId];
	}

	create(input: AppPolicyCreateInput) {
		const now = new Date().toISOString();
		const policy: AppPolicy = {
			id: `app-policy-${crypto.randomUUID()}`,
			...normalizeCreateInput(input),
			createdAt: now,
			updatedAt: now,
		};

		this.state.policies[policy.id] = policy;
		this.save();

		return policy;
	}

	update(policyId: string, input: AppPolicyUpdateInput) {
		const current = this.state.policies[policyId];
		if (!current) return null;

		const policy: AppPolicy = {
			...current,
			...normalizeUpdateInput(input),
			updatedAt: new Date().toISOString(),
		};

		this.state.policies[policyId] = policy;
		this.save();

		return policy;
	}

	upsertAppOverride(input: AppPolicyOverrideInput) {
		const displayName = normalizeText(input.displayName);
		const existing = this.list().find((policy) =>
			isDirectAppOverride(policy, input.serverId, input.appId),
		);

		if (input.importance === "normal" && !displayName) {
			if (existing) this.delete(existing.id);
			return null;
		}

		const now = new Date().toISOString();
		const policy: AppPolicy = {
			id: existing?.id ?? `app-policy-${crypto.randomUUID()}`,
			appId: input.appId,
			appKind: input.appKind,
			createdAt: existing?.createdAt ?? now,
			...(displayName ? { displayName } : {}),
			enabled: true,
			importance: input.importance,
			name: `${input.appName.trim()} override`,
			serverId: input.serverId,
			updatedAt: now,
		};

		this.state.policies[policy.id] = policy;
		this.save();

		return policy;
	}

	delete(policyId: string) {
		if (!this.state.policies[policyId]) return false;

		delete this.state.policies[policyId];
		this.save();

		return true;
	}

	private load(): AppPolicyState {
		const persisted = this.documents.get<AppPolicyState>(configKey);
		if (persisted) return normalizeState(persisted);

		const state = emptyState();
		this.documents.set(configKey, state);
		return state;
	}

	private save() {
		this.documents.set(configKey, this.state);
	}
}
