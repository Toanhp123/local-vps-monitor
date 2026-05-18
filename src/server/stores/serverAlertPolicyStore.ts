import type {
	ServerAlertPolicy,
	ServerAlertPolicyUpdateInput,
	ServerAlertThresholds,
} from "../../shared/types";
import {
	defaultServerAlertPolicy,
	defaultServerAlertThresholds,
} from "../domain/monitoring/policies/serverResourcePolicy";
import {
	ConfigDocumentStore,
	readLegacyConfigDocument,
} from "./database/configDocumentStore";

type LegacyServerAlertPolicy = Partial<ServerAlertThresholds> &
	Partial<ServerAlertPolicy>;

const configKey = "server_alert_policy";

const isThresholdInput = (
	value: unknown,
): value is Partial<ServerAlertThresholds> => {
	return Boolean(value) && typeof value === "object";
};

const numberOrFallback = (
	value: unknown,
	fallback: number,
	min: number,
	max: number,
) => {
	return typeof value === "number" &&
		Number.isFinite(value) &&
		value >= min &&
		value <= max
		? value
		: fallback;
};

const normalizePair = (
	warningValue: unknown,
	criticalValue: unknown,
	warningFallback: number,
	criticalFallback: number,
	max: number,
) => {
	const warning = numberOrFallback(warningValue, warningFallback, 1, max);
	const critical = numberOrFallback(criticalValue, criticalFallback, 1, max);

	return warning < critical
		? { critical, warning }
		: { critical: criticalFallback, warning: warningFallback };
};

const normalizeThresholds = (
	value: unknown,
	fallback: ServerAlertThresholds,
) => {
	if (!isThresholdInput(value)) return fallback;

	const disk = normalizePair(
		value.diskWarningPercent,
		value.diskCriticalPercent,
		fallback.diskWarningPercent,
		fallback.diskCriticalPercent,
		99,
	);
	const memory = normalizePair(
		value.memoryWarningPercent,
		value.memoryCriticalPercent,
		fallback.memoryWarningPercent,
		fallback.memoryCriticalPercent,
		99,
	);
	const cpuLoad = normalizePair(
		value.cpuLoadWarningPercent,
		value.cpuLoadCriticalPercent,
		fallback.cpuLoadWarningPercent,
		fallback.cpuLoadCriticalPercent,
		300,
	);

	return {
		cpuLoadCriticalPercent: cpuLoad.critical,
		cpuLoadWarningPercent: cpuLoad.warning,
		diskCriticalPercent: disk.critical,
		diskWarningPercent: disk.warning,
		memoryCriticalPercent: memory.critical,
		memoryWarningPercent: memory.warning,
	} satisfies ServerAlertThresholds;
};

const normalizeServerOverrides = (
	value: unknown,
	defaults: ServerAlertThresholds,
) => {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return {};
	}

	const overrides: Record<string, ServerAlertThresholds> = {};

	for (const [serverId, thresholds] of Object.entries(value)) {
		const normalized = normalizeThresholds(thresholds, defaults);
		if (JSON.stringify(normalized) !== JSON.stringify(defaults)) {
			overrides[serverId] = normalized;
		}
	}

	return overrides;
};

const normalizePolicy = (policy: LegacyServerAlertPolicy | undefined) => {
	if (!policy || typeof policy !== "object") return defaultServerAlertPolicy;

	const defaults = normalizeThresholds(
		"defaults" in policy ? policy.defaults : policy,
		defaultServerAlertThresholds,
	);

	return {
		defaults,
		serverOverrides: normalizeServerOverrides(
			policy.serverOverrides,
			defaults,
		),
	} satisfies ServerAlertPolicy;
};

export class ServerAlertPolicyStore {
	private policy: ServerAlertPolicy;

	constructor(
		private readonly documents: ConfigDocumentStore,
		private readonly legacyFilePath: string,
	) {
		this.policy = this.load();
	}

	get() {
		return this.policy;
	}

	replace(input: ServerAlertPolicyUpdateInput) {
		this.policy = normalizePolicy(input);
		this.save();

		return this.policy;
	}

	private load(): ServerAlertPolicy {
		const persisted =
			this.documents.get<LegacyServerAlertPolicy>(configKey);
		if (persisted) return normalizePolicy(persisted);

		const legacy = readLegacyConfigDocument(
			this.legacyFilePath,
			"alert policy",
		);
		const policy = normalizePolicy(legacy.value as LegacyServerAlertPolicy);

		if (legacy.found) this.documents.set(configKey, policy);

		return policy;
	}

	private save() {
		this.documents.set(configKey, this.policy);
	}
}
