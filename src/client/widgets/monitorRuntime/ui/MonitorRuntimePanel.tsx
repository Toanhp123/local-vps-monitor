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
} from "../../../../shared/types";
import { NumberInputField } from "../../../shared/ui/NumberInputField";
import { SettingsPanelFrame } from "../../../shared/ui/SettingsPanelFrame";
import {
	emptyMonitorRuntimeForm,
	monitorRuntimeFieldSections,
	monitorRuntimeFormFromSettings,
	msSummary,
	parseMonitorRuntimeForm,
	validateMonitorRuntimeForm,
	type MonitorRuntimeFormState,
	type MonitorRuntimeSectionId,
} from "../model/monitorRuntimeForm";

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

		setForm(monitorRuntimeFormFromSettings(settings));
	}, [settings]);

	const draftSettings = useMemo(() => parseMonitorRuntimeForm(form), [form]);
	const validationError = useMemo(
		() => validateMonitorRuntimeForm(form),
		[form],
	);
	const isDirty =
		settings !== null &&
		JSON.stringify(draftSettings) !== JSON.stringify(settings);
	const canSave = !isLoading && !isSaving && isDirty && !validationError;

	const updateField = (field: keyof MonitorRuntimeFormState, value: string) => {
		setForm((current) => ({
			...current,
			[field]: value,
		}));
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!canSave) return;

		void onSaveSettings(draftSettings);
	};

	return (
		<SettingsPanelFrame
			badges={
				<>
					<span className="inline-flex min-h-6 items-center gap-1.5 rounded-full bg-blue-50 px-2.5 text-xs font-extrabold text-blue-700">
						<RadioTower size={13} />
						Auto {msSummary(settings?.autoScanIntervalMs)}
					</span>
					<span className="inline-flex min-h-6 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-xs font-extrabold text-slate-700">
						<Clock size={13} />
						Offline {msSummary(settings?.offlineAfterMs)}
					</span>
					<span className="inline-flex min-h-6 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-xs font-extrabold text-slate-700">
						<History size={13} />
						History {settings?.metricHistoryLimit ?? "--"}
					</span>
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
			title="Monitor Runtime"
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
