import type {
	ServerAlertPolicy,
	ServerAlertThresholds,
} from "../../../../shared/types";

export type ThresholdFormState = Record<keyof ServerAlertThresholds, string>;

export type ServerAlertResourceId = "cpuLoad" | "disk" | "memory";

export interface ServerAlertResourceConfig {
	criticalKey: keyof ServerAlertThresholds;
	id: ServerAlertResourceId;
	label: string;
	max: number;
	warningKey: keyof ServerAlertThresholds;
}

export const serverAlertResources: ServerAlertResourceConfig[] = [
	{
		criticalKey: "diskCriticalPercent",
		id: "disk",
		label: "Disk",
		max: 99,
		warningKey: "diskWarningPercent",
	},
	{
		criticalKey: "memoryCriticalPercent",
		id: "memory",
		label: "Memory",
		max: 99,
		warningKey: "memoryWarningPercent",
	},
	{
		criticalKey: "cpuLoadCriticalPercent",
		id: "cpuLoad",
		label: "CPU load",
		max: 300,
		warningKey: "cpuLoadWarningPercent",
	},
];

export const emptyThresholdForm = (): ThresholdFormState => ({
	cpuLoadCriticalPercent: "",
	cpuLoadWarningPercent: "",
	diskCriticalPercent: "",
	diskWarningPercent: "",
	memoryCriticalPercent: "",
	memoryWarningPercent: "",
});

const toInputValue = (value: number | undefined) =>
	value === undefined ? "" : String(value);

const parsePercent = (value: string) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : NaN;
};

export const thresholdFormFromValues = (
	thresholds: ServerAlertThresholds,
): ThresholdFormState => ({
	cpuLoadCriticalPercent: toInputValue(thresholds.cpuLoadCriticalPercent),
	cpuLoadWarningPercent: toInputValue(thresholds.cpuLoadWarningPercent),
	diskCriticalPercent: toInputValue(thresholds.diskCriticalPercent),
	diskWarningPercent: toInputValue(thresholds.diskWarningPercent),
	memoryCriticalPercent: toInputValue(thresholds.memoryCriticalPercent),
	memoryWarningPercent: toInputValue(thresholds.memoryWarningPercent),
});

export const parseThresholdForm = (
	form: ThresholdFormState,
): ServerAlertThresholds => ({
	cpuLoadCriticalPercent: parsePercent(form.cpuLoadCriticalPercent),
	cpuLoadWarningPercent: parsePercent(form.cpuLoadWarningPercent),
	diskCriticalPercent: parsePercent(form.diskCriticalPercent),
	diskWarningPercent: parsePercent(form.diskWarningPercent),
	memoryCriticalPercent: parsePercent(form.memoryCriticalPercent),
	memoryWarningPercent: parsePercent(form.memoryWarningPercent),
});

export const validateThresholds = (thresholds: ServerAlertThresholds) => {
	for (const resource of serverAlertResources) {
		const warning = thresholds[resource.warningKey];
		const critical = thresholds[resource.criticalKey];

		if (!Number.isFinite(warning) || !Number.isFinite(critical)) {
			return `${resource.label} thresholds must be valid numbers.`;
		}
		if (
			warning < 1 ||
			warning > resource.max ||
			critical < 1 ||
			critical > resource.max
		) {
			return `${resource.label} thresholds must be between 1 and ${resource.max}.`;
		}
		if (warning >= critical) {
			return `${resource.label} warning threshold must be lower than critical threshold.`;
		}
	}

	return "";
};

export const normalizeServerAlertPolicyForCompare = (
	policy: ServerAlertPolicy,
) => ({
	defaults: policy.defaults,
	serverOverrides: Object.fromEntries(
		Object.entries(policy.serverOverrides).sort(([left], [right]) =>
			left.localeCompare(right),
		),
	),
});
