import type {
	MonitorRuntimeSettings,
	ServerMonitorRuntimeOverrides,
	ServerMonitorRuntimeSettings,
} from "@shared/types";

export type MonitorRuntimeFieldKey = Exclude<
	keyof MonitorRuntimeSettings,
	"serverOverrides"
>;

export type MonitorRuntimeGlobalSettings = Pick<
	MonitorRuntimeSettings,
	MonitorRuntimeFieldKey
>;

export type MonitorRuntimeFormState = Record<MonitorRuntimeFieldKey, string>;

export type MonitorRuntimeSectionId =
	| "concurrency"
	| "logs"
	| "retention"
	| "scan"
	| "timeout";

export interface MonitorRuntimeFieldConfig<
	Key extends MonitorRuntimeFieldKey = MonitorRuntimeFieldKey,
> {
	key: Key;
	label: string;
	max: number;
	min: number;
	scale: number;
	step?: number;
	unit: string;
}

export interface MonitorRuntimeFieldSection {
	fields: MonitorRuntimeFieldConfig[];
	id: MonitorRuntimeSectionId;
	title: string;
}

export const monitorRuntimeFieldSections: MonitorRuntimeFieldSection[] = [
	{
		id: "scan",
		title: "Scan cadence",
		fields: [
			{
				key: "autoScanIntervalMs",
				label: "Auto scan",
				max: 3600,
				min: 0,
				scale: 1000,
				unit: "sec",
			},
			{
				key: "offlineAfterMs",
				label: "Offline after",
				max: 3600,
				min: 5,
				scale: 1000,
				unit: "sec",
			},
			{
				key: "realtimeBroadcastMs",
				label: "Realtime broadcast",
				max: 60,
				min: 1,
				scale: 1000,
				unit: "sec",
			},
		],
	},
	{
		id: "timeout",
		title: "Command timeout",
		fields: [
			{
				key: "sshCommandTimeoutMs",
				label: "SSH command",
				max: 120,
				min: 1,
				scale: 1000,
				unit: "sec",
			},
			{
				key: "localDockerCommandTimeoutMs",
				label: "Local Docker",
				max: 120,
				min: 1,
				scale: 1000,
				unit: "sec",
			},
		],
	},
	{
		id: "concurrency",
		title: "Concurrency",
		fields: [
			{
				key: "sshScanConcurrency",
				label: "SSH scans",
				max: 32,
				min: 1,
				scale: 1,
				unit: "workers",
			},
			{
				key: "httpCheckConcurrency",
				label: "HTTP checks",
				max: 32,
				min: 1,
				scale: 1,
				unit: "workers",
			},
		],
	},
	{
		id: "retention",
		title: "Retention",
		fields: [
			{
				key: "metricHistoryLimit",
				label: "Metric history",
				max: 1440,
				min: 10,
				scale: 1,
				unit: "points",
			},
			{
				key: "incidentHistoryLimit",
				label: "Incident history",
				max: 1000,
				min: 10,
				scale: 1,
				unit: "events",
			},
		],
	},
	{
		id: "logs",
		title: "Logs",
		fields: [
			{
				key: "defaultAppLogLines",
				label: "Default app logs",
				max: 1000,
				min: 10,
				scale: 1,
				unit: "lines",
			},
		],
	},
];

const flatFields = monitorRuntimeFieldSections.flatMap((section) => section.fields);

export const emptyMonitorRuntimeForm = (): MonitorRuntimeFormState => ({
	autoScanIntervalMs: "",
	defaultAppLogLines: "",
	httpCheckConcurrency: "",
	incidentHistoryLimit: "",
	localDockerCommandTimeoutMs: "",
	metricHistoryLimit: "",
	offlineAfterMs: "",
	realtimeBroadcastMs: "",
	sshCommandTimeoutMs: "",
	sshScanConcurrency: "",
});

export const msSummary = (value: number | undefined) =>
	value === undefined ? "--" : `${Math.round(value / 1000)}s`;

const formatFieldValue = (
	value: number,
	field: MonitorRuntimeFieldConfig,
) => {
	const scaled = value / field.scale;
	return Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(1);
};

export const monitorRuntimeGlobalSettingsFromSettings = (
	settings: MonitorRuntimeSettings,
) => {
	const globalSettings = {} as MonitorRuntimeGlobalSettings;

	for (const field of flatFields) {
		globalSettings[field.key] = settings[field.key];
	}

	return globalSettings;
};

export const monitorRuntimeFormFromSettings = (
	settings: MonitorRuntimeGlobalSettings,
) => {
	const form = emptyMonitorRuntimeForm();

	for (const field of flatFields) {
		form[field.key] = formatFieldValue(settings[field.key], field);
	}

	return form;
};

const parseFieldValue = (
	form: Record<string, string>,
	field: MonitorRuntimeFieldConfig,
) => {
	const value = Number(form[field.key]);
	return Number.isFinite(value) ? Math.round(value * field.scale) : NaN;
};

export const parseMonitorRuntimeForm = (
	form: MonitorRuntimeFormState,
): MonitorRuntimeGlobalSettings => {
	const settings = {} as MonitorRuntimeGlobalSettings;

	for (const field of flatFields) {
		settings[field.key] = parseFieldValue(form, field);
	}

	return settings;
};

export const validateMonitorRuntimeForm = (form: MonitorRuntimeFormState) => {
	for (const field of flatFields) {
		const value = Number(form[field.key]);

		if (!Number.isFinite(value)) {
			return `${field.label} must be a number.`;
		}
		if (value < field.min || value > field.max) {
			return `${field.label} must be between ${field.min} and ${field.max} ${field.unit}.`;
		}
	}

	return "";
};

export type ServerMonitorRuntimeFieldKey =
	keyof ServerMonitorRuntimeSettings;

export type ServerMonitorRuntimeFormState = Record<
	ServerMonitorRuntimeFieldKey,
	string
>;

export type ServerMonitorRuntimeFieldConfig =
	MonitorRuntimeFieldConfig<ServerMonitorRuntimeFieldKey>;

const serverMonitorRuntimeFieldsByKey: Record<
	ServerMonitorRuntimeFieldKey,
	ServerMonitorRuntimeFieldConfig
> = {
	defaultAppLogLines: {
		key: "defaultAppLogLines",
		label: "Default app logs",
		max: 1000,
		min: 10,
		scale: 1,
		unit: "lines",
	},
	localDockerCommandTimeoutMs: {
		key: "localDockerCommandTimeoutMs",
		label: "Local Docker timeout",
		max: 120,
		min: 1,
		scale: 1000,
		unit: "sec",
	},
	offlineAfterMs: {
		key: "offlineAfterMs",
		label: "Offline after",
		max: 3600,
		min: 5,
		scale: 1000,
		unit: "sec",
	},
	sshCommandTimeoutMs: {
		key: "sshCommandTimeoutMs",
		label: "SSH command timeout",
		max: 120,
		min: 1,
		scale: 1000,
		unit: "sec",
	},
};

const localDockerServerId = "local-docker";

export const serverMonitorRuntimeFieldsForServer = (serverId: string) => [
	serverMonitorRuntimeFieldsByKey.offlineAfterMs,
	serverMonitorRuntimeFieldsByKey.defaultAppLogLines,
	serverId === localDockerServerId
		? serverMonitorRuntimeFieldsByKey.localDockerCommandTimeoutMs
		: serverMonitorRuntimeFieldsByKey.sshCommandTimeoutMs,
];

export const serverMonitorRuntimeDefaultsFromSettings = (
	settings: MonitorRuntimeSettings,
): ServerMonitorRuntimeSettings => ({
	defaultAppLogLines: settings.defaultAppLogLines,
	localDockerCommandTimeoutMs: settings.localDockerCommandTimeoutMs,
	offlineAfterMs: settings.offlineAfterMs,
	sshCommandTimeoutMs: settings.sshCommandTimeoutMs,
});

export const resolveServerMonitorRuntimeSettings = (
	settings: MonitorRuntimeSettings,
	serverId: string,
): ServerMonitorRuntimeSettings => {
	const override = settings.serverOverrides[serverId] ?? {};
	const defaults = serverMonitorRuntimeDefaultsFromSettings(settings);

	return {
		defaultAppLogLines:
			override.defaultAppLogLines ?? defaults.defaultAppLogLines,
		localDockerCommandTimeoutMs:
			override.localDockerCommandTimeoutMs ??
			defaults.localDockerCommandTimeoutMs,
		offlineAfterMs: override.offlineAfterMs ?? defaults.offlineAfterMs,
		sshCommandTimeoutMs:
			override.sshCommandTimeoutMs ?? defaults.sshCommandTimeoutMs,
	};
};

export const emptyServerMonitorRuntimeForm =
	(): ServerMonitorRuntimeFormState => ({
		defaultAppLogLines: "",
		localDockerCommandTimeoutMs: "",
		offlineAfterMs: "",
		sshCommandTimeoutMs: "",
	});

export const serverMonitorRuntimeFormFromValues = (
	settings: ServerMonitorRuntimeSettings,
) => {
	const form = emptyServerMonitorRuntimeForm();

	for (const field of Object.values(serverMonitorRuntimeFieldsByKey)) {
		form[field.key] = formatFieldValue(settings[field.key], field);
	}

	return form;
};

export const pickServerMonitorRuntimeOverride = (
	override: ServerMonitorRuntimeOverrides | undefined,
	fields: ServerMonitorRuntimeFieldConfig[],
) => {
	const picked: ServerMonitorRuntimeOverrides = {};
	if (!override) return picked;

	for (const field of fields) {
		const value = override[field.key];
		if (value !== undefined) picked[field.key] = value;
	}

	return picked;
};

export const parseServerMonitorRuntimeForm = (
	form: ServerMonitorRuntimeFormState,
	fields: ServerMonitorRuntimeFieldConfig[],
) => {
	const override: ServerMonitorRuntimeOverrides = {};

	for (const field of fields) {
		override[field.key] = parseFieldValue(form, field);
	}

	return override;
};

export const validateServerMonitorRuntimeForm = (
	form: ServerMonitorRuntimeFormState,
	fields: ServerMonitorRuntimeFieldConfig[],
) => {
	for (const field of fields) {
		const value = Number(form[field.key]);

		if (!Number.isFinite(value)) {
			return `${field.label} must be a number.`;
		}
		if (value < field.min || value > field.max) {
			return `${field.label} must be between ${field.min} and ${field.max} ${field.unit}.`;
		}
	}

	return "";
};
