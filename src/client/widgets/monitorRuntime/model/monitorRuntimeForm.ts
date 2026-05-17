import type { MonitorRuntimeSettings } from "../../../../shared/types";

export type MonitorRuntimeFormState = Record<keyof MonitorRuntimeSettings, string>;

export type MonitorRuntimeSectionId =
	| "concurrency"
	| "logs"
	| "retention"
	| "scan"
	| "timeout";

export interface MonitorRuntimeFieldConfig {
	key: keyof MonitorRuntimeSettings;
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

export const monitorRuntimeFormFromSettings = (
	settings: MonitorRuntimeSettings,
) => {
	const form = emptyMonitorRuntimeForm();

	for (const field of flatFields) {
		form[field.key] = formatFieldValue(settings[field.key], field);
	}

	return form;
};

const parseFieldValue = (
	form: MonitorRuntimeFormState,
	field: MonitorRuntimeFieldConfig,
) => {
	const value = Number(form[field.key]);
	return Number.isFinite(value) ? Math.round(value * field.scale) : NaN;
};

export const parseMonitorRuntimeForm = (
	form: MonitorRuntimeFormState,
): MonitorRuntimeSettings => {
	const settings = {} as MonitorRuntimeSettings;

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
