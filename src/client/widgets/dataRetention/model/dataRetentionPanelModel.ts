import { Trash2, Wrench, type LucideIcon } from "lucide-react";
import type { DataRetentionSettings } from "@shared/types";
import type { DataRetentionMaintenanceAction } from "@/features/dataRetention";

export const defaultDataRetentionSettings: DataRetentionSettings = {
	dataRetentionEnabled: true,
	incidentsRetentionDays: 90,
	metricsRetentionDays: 30,
};

export const retentionDaysFromInput = (value: string) => {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return 1;

	return Math.min(365, Math.max(1, Math.round(parsed)));
};

export const dataRetentionSettingsKey = (settings: DataRetentionSettings) =>
	JSON.stringify(settings);

export const dataRetentionMaintenanceConfig: Record<
	DataRetentionMaintenanceAction,
	{
		buttonLabel: string;
		confirmLabel: string;
		description: string;
		icon: LucideIcon;
		message: string;
	}
> = {
	cleanup: {
		buttonLabel: "Run cleanup",
		confirmLabel: "Run cleanup",
		description: "Delete expired metrics and resolved incidents.",
		icon: Trash2,
		message:
			"Cleanup will save the current retention settings first, then remove expired database rows.",
	},
	vacuum: {
		buttonLabel: "Vacuum database",
		confirmLabel: "Vacuum",
		description: "Reclaim SQLite file space after cleanup.",
		icon: Wrench,
		message:
			"Vacuum can briefly block database writes while SQLite compacts the file.",
	},
};
