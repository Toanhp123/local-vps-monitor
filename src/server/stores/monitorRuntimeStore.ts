import type {
	MonitorRuntimeSettings,
	MonitorRuntimeSettingsUpdateInput,
	ServerMonitorRuntimeOverrides,
	ServerMonitorRuntimeSettings,
} from "../../shared/types";
import { ConfigDocumentStore } from "./database/configDocumentStore";

const configKey = "monitor_runtime";

const clampNumber = (value: unknown, fallback: number, min: number, max: number) => {
	if (typeof value !== "number" || !Number.isFinite(value)) return fallback;

	return Math.min(max, Math.max(min, Math.round(value)));
};

const clampOptionalNumber = (value: unknown, min: number, max: number) => {
	if (typeof value !== "number" || !Number.isFinite(value)) return undefined;

	return Math.min(max, Math.max(min, Math.round(value)));
};

const normalizeServerOverride = (value: unknown) => {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return null;
	}

	const input = value as Partial<ServerMonitorRuntimeOverrides>;
	const override: ServerMonitorRuntimeOverrides = {};
	const autoScanIntervalMs = clampOptionalNumber(
		input.autoScanIntervalMs,
		0,
		3_600_000,
	);
	const defaultAppLogLines = clampOptionalNumber(
		input.defaultAppLogLines,
		10,
		1_000,
	);
	const localDockerCommandTimeoutMs = clampOptionalNumber(
		input.localDockerCommandTimeoutMs,
		1_000,
		120_000,
	);
	const offlineAfterMs = clampOptionalNumber(
		input.offlineAfterMs,
		5_000,
		3_600_000,
	);
	const sshCommandTimeoutMs = clampOptionalNumber(
		input.sshCommandTimeoutMs,
		1_000,
		120_000,
	);

	if (autoScanIntervalMs !== undefined) {
		override.autoScanIntervalMs = autoScanIntervalMs;
	}
	if (defaultAppLogLines !== undefined) {
		override.defaultAppLogLines = defaultAppLogLines;
	}
	if (localDockerCommandTimeoutMs !== undefined) {
		override.localDockerCommandTimeoutMs = localDockerCommandTimeoutMs;
	}
	if (offlineAfterMs !== undefined) {
		override.offlineAfterMs = offlineAfterMs;
	}
	if (sshCommandTimeoutMs !== undefined) {
		override.sshCommandTimeoutMs = sshCommandTimeoutMs;
	}

	return Object.keys(override).length > 0 ? override : null;
};

const normalizeServerOverrides = (
	settings: Partial<MonitorRuntimeSettings> | undefined,
) => {
	const rawOverrides = settings?.serverOverrides;
	if (
		!rawOverrides ||
		typeof rawOverrides !== "object" ||
		Array.isArray(rawOverrides)
	) {
		return {};
	}

	const serverOverrides: Record<string, ServerMonitorRuntimeOverrides> = {};
	for (const [serverId, value] of Object.entries(rawOverrides)) {
		if (!serverId.trim()) continue;

		const override = normalizeServerOverride(value);
		if (override) serverOverrides[serverId] = override;
	}

	return serverOverrides;
};

const normalizeSettings = (
	settings: Partial<MonitorRuntimeSettings> | undefined,
	defaults: MonitorRuntimeSettings,
) => {
	return {
		autoScanIntervalMs: clampNumber(
			settings?.autoScanIntervalMs,
			defaults.autoScanIntervalMs,
			0,
			3_600_000,
		),
		defaultAppLogLines: clampNumber(
			settings?.defaultAppLogLines,
			defaults.defaultAppLogLines,
			10,
			1_000,
		),
		httpCheckConcurrency: clampNumber(
			settings?.httpCheckConcurrency,
			defaults.httpCheckConcurrency,
			1,
			32,
		),
		incidentHistoryLimit: clampNumber(
			settings?.incidentHistoryLimit,
			defaults.incidentHistoryLimit,
			10,
			1_000,
		),
		localDockerCommandTimeoutMs: clampNumber(
			settings?.localDockerCommandTimeoutMs,
			defaults.localDockerCommandTimeoutMs,
			1_000,
			120_000,
		),
		offlineAfterMs: clampNumber(
			settings?.offlineAfterMs,
			defaults.offlineAfterMs,
			5_000,
			3_600_000,
		),
		realtimeBroadcastMs: clampNumber(
			settings?.realtimeBroadcastMs,
			defaults.realtimeBroadcastMs,
			1_000,
			60_000,
		),
		serverOverrides: normalizeServerOverrides(settings),
		sshCommandTimeoutMs: clampNumber(
			settings?.sshCommandTimeoutMs,
			defaults.sshCommandTimeoutMs,
			1_000,
			120_000,
		),
		sshScanConcurrency: clampNumber(
			settings?.sshScanConcurrency,
			defaults.sshScanConcurrency,
			1,
			32,
		),
	} satisfies MonitorRuntimeSettings;
};

export class MonitorRuntimeStore {
	private settings: MonitorRuntimeSettings;

	constructor(
		private readonly documents: ConfigDocumentStore,
		private readonly defaults: MonitorRuntimeSettings,
	) {
		this.settings = this.load();
	}

	get() {
		return this.settings;
	}

	getServerSettings(serverId: string): ServerMonitorRuntimeSettings {
		const override = this.settings.serverOverrides[serverId] ?? {};

		return {
			autoScanIntervalMs:
				override.autoScanIntervalMs ?? this.settings.autoScanIntervalMs,
			defaultAppLogLines:
				override.defaultAppLogLines ?? this.settings.defaultAppLogLines,
			localDockerCommandTimeoutMs:
				override.localDockerCommandTimeoutMs ??
				this.settings.localDockerCommandTimeoutMs,
			offlineAfterMs: override.offlineAfterMs ?? this.settings.offlineAfterMs,
			sshCommandTimeoutMs:
				override.sshCommandTimeoutMs ?? this.settings.sshCommandTimeoutMs,
		};
	}

	replace(input: MonitorRuntimeSettingsUpdateInput) {
		const normalized = normalizeSettings(input, this.defaults);

		if (normalized.offlineAfterMs < normalized.autoScanIntervalMs * 1.5) {
			throw new Error(
				"Offline timeout must be at least 1.5x the auto scan interval to prevent false offline detection",
			);
		}

		for (const [serverId, override] of Object.entries(
			normalized.serverOverrides,
		)) {
			const effectiveAutoScan =
				override.autoScanIntervalMs ?? normalized.autoScanIntervalMs;
			const effectiveOffline =
				override.offlineAfterMs ?? normalized.offlineAfterMs;

			if (effectiveOffline < effectiveAutoScan * 1.5) {
				throw new Error(
					`Server ${serverId}: Offline timeout must be at least 1.5x the auto scan interval`,
				);
			}
		}

		this.settings = normalized;
		this.save();

		return this.settings;
	}

	private load(): MonitorRuntimeSettings {
		const persisted =
			this.documents.get<Partial<MonitorRuntimeSettings>>(configKey);
		if (persisted) return normalizeSettings(persisted, this.defaults);

		const settings = normalizeSettings(undefined, this.defaults);
		this.documents.set(configKey, settings);
		return settings;
	}

	private save() {
		this.documents.set(configKey, this.settings);
	}
}
