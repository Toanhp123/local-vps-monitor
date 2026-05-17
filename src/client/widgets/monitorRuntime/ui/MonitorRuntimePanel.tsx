import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
	Clock,
	Database,
	FileText,
	History,
	RadioTower,
	ServerCog,
	Settings2,
	Zap,
	type LucideIcon,
} from "lucide-react";
import type {
	MonitorRuntimeSettings,
	MonitorRuntimeSettingsUpdateInput,
} from "@shared/types";
import { Badge } from "@/shared/ui/Badge";
import { NumberInputField } from "@/shared/ui/NumberInputField";
import { SettingsPanelFrame } from "@/shared/ui/SettingsPanelFrame";
import {
	emptyMonitorRuntimeForm,
	monitorRuntimeFieldSections,
	monitorRuntimeFormFromSettings,
	monitorRuntimeGlobalSettingsFromSettings,
	msSummary,
	parseMonitorRuntimeForm,
	validateMonitorRuntimeForm,
	type MonitorRuntimeFormState,
	type MonitorRuntimeSectionId,
} from "@/features/monitorRuntime";

const sectionIcons: Record<MonitorRuntimeSectionId, LucideIcon> = {
	concurrency: ServerCog,
	logs: FileText,
	retention: Database,
	scan: Clock,
	timeout: Zap,
};

export function MonitorRuntimePanel({
	error,
	isLoading,
	isSaving,
	onSaveSettings,
	settings,
}: {
	error: string;
	isLoading: boolean;
	isSaving: boolean;
	onSaveSettings: (input: MonitorRuntimeSettingsUpdateInput) => Promise<boolean>;
	settings: MonitorRuntimeSettings | null;
}) {
	const [form, setForm] = useState<MonitorRuntimeFormState>(() =>
		emptyMonitorRuntimeForm(),
	);

	useEffect(() => {
		if (!settings) return;

		setForm(
			monitorRuntimeFormFromSettings(
				monitorRuntimeGlobalSettingsFromSettings(settings),
			),
		);
	}, [settings]);

	const draftGlobalSettings = useMemo(
		() => parseMonitorRuntimeForm(form),
		[form],
	);
	const draftSettings = useMemo(
		() =>
			settings
				? {
						...settings,
						...draftGlobalSettings,
					}
				: null,
		[draftGlobalSettings, settings],
	);
	const currentGlobalSettings = useMemo(
		() =>
			settings ? monitorRuntimeGlobalSettingsFromSettings(settings) : null,
		[settings],
	);
	const validationError = useMemo(
		() => validateMonitorRuntimeForm(form),
		[form],
	);
	const isDirty =
		currentGlobalSettings !== null &&
		JSON.stringify(draftGlobalSettings) !==
			JSON.stringify(currentGlobalSettings);
	const canSave = !isLoading && !isSaving && isDirty && !validationError;

	const updateField = (field: keyof MonitorRuntimeFormState, value: string) => {
		setForm((current) => ({
			...current,
			[field]: value,
		}));
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!canSave || !draftSettings) return;

		void onSaveSettings(draftSettings);
	};

	return (
		<SettingsPanelFrame
			badges={
				<>
					<Badge icon={RadioTower} tone="blue">
						Auto {msSummary(settings?.autoScanIntervalMs)}
					</Badge>
					<Badge icon={Clock}>
						Offline {msSummary(settings?.offlineAfterMs)}
					</Badge>
					<Badge icon={History}>
						History {settings?.metricHistoryLimit ?? "--"}
					</Badge>
				</>
			}
			canSave={canSave}
			error={error}
			icon={<Settings2 size={18} />}
			iconClassName="bg-blue-50 text-blue-700"
			isLoading={isLoading}
			isSaving={isSaving}
			loadingText="Loading monitor runtime settings"
			onSubmit={handleSubmit}
			title="Runtime Defaults"
		>
			<div className="grid gap-3">
				{monitorRuntimeFieldSections.map((section) => {
					const Icon = sectionIcons[section.id];

					return (
						<div
							key={section.id}
							className="rounded-lg border border-slate-200 bg-slate-50 p-3.5"
						>
							<div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
								<Icon size={15} />
								{section.title}
							</div>
							<div className="grid grid-cols-3 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
								{section.fields.map((field) => (
									<NumberInputField
										key={field.key}
										disabled={isSaving}
										label={field.label}
										max={field.max}
										min={field.min}
										onChange={(value) =>
											updateField(field.key, value)
										}
										step={field.step}
										unit={field.unit}
										value={form[field.key]}
									/>
								))}
							</div>
						</div>
					);
				})}
			</div>

			{validationError && (
				<div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-bold text-rose-800">
					{validationError}
				</div>
			)}
		</SettingsPanelFrame>
	);
}
