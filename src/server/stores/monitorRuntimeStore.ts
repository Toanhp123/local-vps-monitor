import fs from "node:fs";
import path from "node:path";
import type {
	MonitorRuntimeSettings,
	MonitorRuntimeSettingsUpdateInput,
} from "../../shared/types";

const clampNumber = (value: unknown, fallback: number, min: number, max: number) => {
	if (typeof value !== "number" || !Number.isFinite(value)) return fallback;

	return Math.min(max, Math.max(min, Math.round(value)));
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
		metricHistoryLimit: clampNumber(
			settings?.metricHistoryLimit,
			defaults.metricHistoryLimit,
			10,
			1_440,
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
		private readonly filePath: string,
		private readonly defaults: MonitorRuntimeSettings,
	) {
		this.settings = this.load();
	}

	get() {
		return this.settings;
	}

	replace(input: MonitorRuntimeSettingsUpdateInput) {
		this.settings = normalizeSettings(input, this.defaults);
		this.save();

		return this.settings;
	}

	private load(): MonitorRuntimeSettings {
		if (!fs.existsSync(this.filePath)) return this.defaults;

		try {
			const raw = fs.readFileSync(this.filePath, "utf8");
			return normalizeSettings(
				JSON.parse(raw) as Partial<MonitorRuntimeSettings>,
				this.defaults,
			);
		} catch (error) {
			console.warn(
				`Cannot read monitor runtime settings at ${this.filePath}:`,
				error,
			);
			return this.defaults;
		}
	}

	private save() {
		fs.mkdirSync(path.dirname(this.filePath), { recursive: true });

		const tempPath = `${this.filePath}.tmp`;
		fs.writeFileSync(tempPath, JSON.stringify(this.settings, null, 2), {
			mode: 0o600,
		});
		fs.renameSync(tempPath, this.filePath);

		if (process.platform !== "win32") {
			fs.chmodSync(this.filePath, 0o600);
		}
	}
}
