import {
	useEffect,
	useMemo,
	useState,
	type FormEvent,
	type ReactNode,
} from "react";
import {
	AlertCircle,
	BarChart3,
	CalendarDays,
	Database,
	GitBranch,
	Power,
	RefreshCw,
	Trash2,
	Wrench,
	type LucideIcon,
} from "lucide-react";
import type {
	DatabaseStats,
	DataRetentionSettings,
	DataRetentionSettingsUpdateInput,
} from "@shared/types";
import type { DataRetentionMaintenanceAction } from "@/features/dataRetention";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { NumberInputField } from "@/shared/ui/NumberInputField";
import { SettingsPanelFrame } from "@/shared/ui/SettingsPanelFrame";
import { StatCard } from "@/shared/ui/StatCard";

const defaultSettings: DataRetentionSettings = {
	dataRetentionEnabled: true,
	incidentsRetentionDays: 90,
	metricsRetentionDays: 30,
};

const retentionDaysFromInput = (value: string) => {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return 1;

	return Math.min(365, Math.max(1, Math.round(parsed)));
};

const settingsKey = (settings: DataRetentionSettings) =>
	JSON.stringify(settings);

const maintenanceConfig: Record<
	DataRetentionMaintenanceAction,
	{
		buttonLabel: string;
		confirmLabel: string;
		description: string;
		icon: LucideIcon;
		message: ReactNode;
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
	const [form, setForm] = useState<DataRetentionSettings>(defaultSettings);
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
		settings !== null && settingsKey(form) !== settingsKey(settings);
	const canSave = !isBusy && isDirty;
	const pendingMaintenance = pendingMaintenanceAction
		? maintenanceConfig[pendingMaintenanceAction]
		: null;

	const statsBadges = useMemo(
		() => (
			<>
				<Badge icon={BarChart3} tone="blue">
					{stats?.metricsCount.toLocaleString() ?? "--"} metrics
				</Badge>
				<Badge icon={AlertCircle} tone="amber">
					{stats?.incidentsCount.toLocaleString() ?? "--"} incidents
				</Badge>
				<Badge icon={GitBranch} tone="violet">
					Schema {stats?.schemaVersion ?? "--"}
				</Badge>
			</>
		),
		[stats],
	);

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
			badges={statsBadges}
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
			<div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
				<StatCard
					label="Metrics stored"
					value={stats?.metricsCount.toLocaleString() ?? "--"}
					icon={BarChart3}
				/>
				<StatCard
					label="Incidents stored"
					value={stats?.incidentsCount.toLocaleString() ?? "--"}
					icon={AlertCircle}
					tone="warn"
				/>
				<StatCard
					label="Schema version"
					value={stats?.schemaVersion ?? "--"}
					icon={GitBranch}
					tone="default"
				/>
			</div>

			<div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
				<div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
					<CalendarDays size={15} />
					Retention Policy
				</div>
				<label className="mb-3 flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-3">
					<span className="flex min-w-0 items-center gap-2.5">
						<span
							className={`flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg ${
								form.dataRetentionEnabled
									? "bg-green-100 text-green-700"
									: "bg-slate-100 text-slate-500"
							}`}
						>
							<Power size={16} />
						</span>
						<span className="min-w-0">
							<span className="block text-sm font-extrabold text-slate-900">
								Automatic cleanup
							</span>
							<span className="mt-0.5 block text-xs font-semibold text-slate-500">
								Run retention cleanup on a daily schedule.
							</span>
						</span>
					</span>
					<span className="flex shrink-0 items-center gap-2">
						<Badge
							tone={form.dataRetentionEnabled ? "green" : "gray"}
						>
							{form.dataRetentionEnabled ? "Enabled" : "Disabled"}
						</Badge>
						<input
							type="checkbox"
							checked={form.dataRetentionEnabled}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									dataRetentionEnabled: event.target.checked,
								}))
							}
							className="h-4 w-4 rounded border-slate-300"
						/>
					</span>
				</label>
				<div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
					<NumberInputField
						label="Metrics retention"
						value={String(form.metricsRetentionDays)}
						onChange={(value) =>
							setForm((current) => ({
								...current,
								metricsRetentionDays:
									retentionDaysFromInput(value),
							}))
						}
						min={1}
						max={365}
						unit="days"
					/>
					<NumberInputField
						label="Incidents retention"
						value={String(form.incidentsRetentionDays)}
						onChange={(value) =>
							setForm((current) => ({
								...current,
								incidentsRetentionDays:
									retentionDaysFromInput(value),
							}))
						}
						min={1}
						max={365}
						unit="days"
					/>
				</div>
			</div>

			<div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
				<div className="mb-3 flex items-center justify-between gap-3 max-md:flex-col max-md:items-start">
					<div>
						<div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
							<Wrench size={15} />
							Maintenance
						</div>
						<p className="mt-1 text-xs font-semibold text-slate-500">
							Manual database operations for cleanup and file
							compaction.
						</p>
					</div>
					<Button
						disabled={isBusy}
						icon={RefreshCw}
						isLoading={isStatsLoading}
						onClick={onRefreshStats}
						size="sm"
					>
						Refresh stats
					</Button>
				</div>

				<div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
					{(
						Object.entries(maintenanceConfig) as Array<
							[
								DataRetentionMaintenanceAction,
								(typeof maintenanceConfig)[DataRetentionMaintenanceAction],
							]
						>
					).map(([action, config]) => {
						const Icon = config.icon;

						return (
							<button
								key={action}
								type="button"
								disabled={isBusy}
								onClick={() =>
									setPendingMaintenanceAction(action)
								}
								className="flex min-h-18 cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
							>
								<span className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
									<Icon size={16} />
								</span>
								<span className="min-w-0">
									<span className="block text-sm font-extrabold text-slate-900">
										{config.buttonLabel}
									</span>
									<span className="mt-0.5 block text-xs leading-5 font-semibold text-slate-500">
										{config.description}
									</span>
								</span>
							</button>
						);
					})}
				</div>

				{pendingMaintenance && pendingMaintenanceAction && (
					<div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
						<div className="text-sm font-extrabold text-rose-800">
							Confirm{" "}
							{pendingMaintenance.buttonLabel.toLowerCase()}
						</div>
						<p className="mt-1 text-xs leading-5 font-semibold text-rose-700">
							{pendingMaintenance.message}
						</p>
						<div className="mt-3 flex justify-end gap-2 max-md:flex-col">
							<Button
								disabled={isBusy}
								onClick={() =>
									setPendingMaintenanceAction(null)
								}
								size="sm"
							>
								Cancel
							</Button>
							<Button
								disabled={isBusy}
								icon={pendingMaintenance.icon}
								isLoading={
									activeMaintenanceAction ===
									pendingMaintenanceAction
								}
								onClick={() =>
									void runMaintenance(
										pendingMaintenanceAction,
									)
								}
								size="sm"
								variant="danger"
							>
								{pendingMaintenance.confirmLabel}
							</Button>
						</div>
					</div>
				)}
			</div>
		</SettingsPanelFrame>
	);
}
