import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type {
	AppMonitorAppOverrideInput,
	AppMonitorRule,
	AppMonitorRuleCreateInput,
	AppMonitorRuleUpdateInput,
} from "../../shared/types";

interface AppMonitorRuleState {
	rules: Record<string, AppMonitorRule>;
}

const emptyState = (): AppMonitorRuleState => ({ rules: {} });

const normalizeText = (value: string | undefined) => {
	const trimmed = value?.trim();
	return trimmed || undefined;
};

const normalizeCreateInput = (input: AppMonitorRuleCreateInput) => ({
	appKind: input.appKind,
	displayName: normalizeText(input.displayName),
	enabled: input.enabled ?? true,
	importance: input.importance,
	match: input.match.trim(),
	matchMode: input.matchMode ?? "contains",
	name: input.name.trim(),
	serverId: normalizeText(input.serverId),
});

const normalizeUpdateInput = (input: AppMonitorRuleUpdateInput) => ({
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
	rule: AppMonitorRule,
	serverId: string,
	appId: string,
) => {
	return rule.serverId === serverId && rule.appId === appId;
};

export class AppMonitorRuleStore {
	private state: AppMonitorRuleState;

	constructor(private readonly filePath: string) {
		this.state = this.load();
	}

	list() {
		return Object.values(this.state.rules).sort((left, right) => {
			const serverCompare = (left.serverId || "").localeCompare(
				right.serverId || "",
			);
			if (serverCompare !== 0) return serverCompare;

			return left.name.localeCompare(right.name);
		});
	}

	get(ruleId: string) {
		return this.state.rules[ruleId];
	}

	create(input: AppMonitorRuleCreateInput) {
		const now = new Date().toISOString();
		const rule: AppMonitorRule = {
			id: `app-rule-${crypto.randomUUID()}`,
			...normalizeCreateInput(input),
			createdAt: now,
			updatedAt: now,
		};

		this.state.rules[rule.id] = rule;
		this.save();

		return rule;
	}

	update(ruleId: string, input: AppMonitorRuleUpdateInput) {
		const current = this.state.rules[ruleId];
		if (!current) return null;

		const rule: AppMonitorRule = {
			...current,
			...normalizeUpdateInput(input),
			updatedAt: new Date().toISOString(),
		};

		this.state.rules[ruleId] = rule;
		this.save();

		return rule;
	}

	upsertAppOverride(input: AppMonitorAppOverrideInput) {
		const displayName = normalizeText(input.displayName);
		const existing = this.list().find((rule) =>
			isDirectAppOverride(rule, input.serverId, input.appId),
		);

		if (input.importance === "normal" && !displayName) {
			if (existing) this.delete(existing.id);
			return null;
		}

		const now = new Date().toISOString();
		const rule: AppMonitorRule = {
			id: existing?.id ?? `app-rule-${crypto.randomUUID()}`,
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

		this.state.rules[rule.id] = rule;
		this.save();

		return rule;
	}

	delete(ruleId: string) {
		if (!this.state.rules[ruleId]) return false;

		delete this.state.rules[ruleId];
		this.save();

		return true;
	}

	private load(): AppMonitorRuleState {
		if (!fs.existsSync(this.filePath)) return emptyState();

		try {
			const raw = fs.readFileSync(this.filePath, "utf8");
			const parsed = JSON.parse(raw) as AppMonitorRuleState;
			return parsed && parsed.rules ? parsed : emptyState();
		} catch (error) {
			console.warn(
				`Cannot read app monitor rules at ${this.filePath}:`,
				error,
			);
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
