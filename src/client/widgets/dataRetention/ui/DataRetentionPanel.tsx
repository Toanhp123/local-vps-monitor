import { useEffect, useState, type FormEvent } from "react";
import { Database } from "lucide-react";
import type {
	DatabaseStats,
	DataRetentionSettings,
	DataRetentionSettingsUpdateInput,
} from "@shared/types";
import type { DataRetentionMaintenanceAction } from "@/features/dataRetention";
import { SettingsPanelFrame } from "@/shared/ui/SettingsPanelFrame";
import {
	dataRetentionSettingsKey,
	defaultDataRetentionSettings,
} from "../model/dataRetentionPanelModel";
import { DataRetentionMaintenanceSection } from "./DataRetentionMaintenanceSection";
import { DataRetentionPolicySection } from "./DataRetentionPolicySection";
import {
	DataRetentionBadges,
	DataRetentionStatsGrid,
} from "./DataRetentionStatsSummary";

export function DataRetentionPanel({
	activeMaintenanceAction,
	error,
	isLoading,
	isSaving,
	isStatsLoading,
	onRefreshStats,
	onRunCleanup,
	onSaveSettings,
	onVacuum,
	settings,
	stats,
}: {
	activeMaintenanceAction: DataRetentionMaintenanceAction | null;
	error: string;
	isLoading: boolean;
	isSaving: boolean;
	isStatsLoading: boolean;
	onRefreshStats: () => void;
	onRunCleanup: (input: DataRetentionSettingsUpdateInput) => Promise<boolean>;
	onSaveSettings: (
		input: DataRetentionSettingsUpdateInput,
	) => Promise<boolean>;
	onVacuum: () => Promise<boolean>;
	settings: DataRetentionSettings | null;
	stats: DatabaseStats | null;
}) {
	const [form, setForm] = useState<DataRetentionSettings>(
		defaultDataRetentionSettings,
	);
	const [pendingMaintenanceAction, setPendingMaintenanceAction] =
		useState<DataRetentionMaintenanceAction | null>(null);

	useEffect(() => {
		if (!settings) return;

		setForm(settings);
	}, [settings]);

	const isBusy =
		isLoading ||
		isSaving ||
		isStatsLoading ||
		activeMaintenanceAction !== null;
	const isDirty =
		settings !== null &&
		dataRetentionSettingsKey(form) !== dataRetentionSettingsKey(settings);
	const canSave = !isBusy && isDirty;

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!canSave) return;

		void onSaveSettings(form);
	};

	const runMaintenance = async (action: DataRetentionMaintenanceAction) => {
		const ok =
			action === "cleanup" ? await onRunCleanup(form) : await onVacuum();
		if (ok) setPendingMaintenanceAction(null);
	};

	return (
		<SettingsPanelFrame
			badges={<DataRetentionBadges stats={stats} />}
			canSave={canSave}
			description="Database retention policy, manual cleanup, and SQLite maintenance."
			error={error}
			icon={<Database size={18} />}
			iconClassName="bg-violet-50 text-violet-700"
			isLoading={isLoading}
			isSaving={isSaving}
			loadingText="Loading database retention settings"
			onSubmit={handleSubmit}
			submitLabel="Save retention"
			title="Data Retention"
		>
			<DataRetentionStatsGrid stats={stats} />
			<DataRetentionPolicySection form={form} onChange={setForm} />
			<DataRetentionMaintenanceSection
				activeMaintenanceAction={activeMaintenanceAction}
				isBusy={isBusy}
				isStatsLoading={isStatsLoading}
				onPendingActionChange={setPendingMaintenanceAction}
				onRefreshStats={onRefreshStats}
				onRunMaintenance={(action) => void runMaintenance(action)}
				pendingMaintenanceAction={pendingMaintenanceAction}
			/>
		</SettingsPanelFrame>
	);
}
