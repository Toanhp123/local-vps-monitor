import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { RotateCcw, Save, TimerReset, X } from "lucide-react";
import type {
	MonitorRuntimeSettings,
	MonitorRuntimeSettingsUpdateInput,
	StoredServer,
} from "@shared/types";
import { Button } from "@/shared/ui/Button";
import { IconButton } from "@/shared/ui/IconButton";
import { NumberInputField } from "@/shared/ui/NumberInputField";
import { ServerStatusBadge } from "@/shared/ui/ServerStatusBadge";
import {
	parseServerMonitorRuntimeForm,
	pickServerMonitorRuntimeOverride,
	resolveServerMonitorRuntimeSettings,
	serverMonitorRuntimeDefaultsFromSettings,
	serverMonitorRuntimeFieldsForServer,
	serverMonitorRuntimeFormFromValues,
	validateServerMonitorRuntimeForm,
	type ServerMonitorRuntimeFormState,
} from "../model/monitorRuntimeForm";

type Trigger = "button" | "icon";

export function ServerMonitorRuntimeDialog({
	error,
	isLoading,
	isSaving,
	onSaveSettings,
	server,
	settings,
	trigger = "icon",
}: {
	error?: string;
	isLoading: boolean;
	isSaving: boolean;
	onSaveSettings: (input: MonitorRuntimeSettingsUpdateInput) => Promise<boolean>;
	server: StoredServer;
	settings: MonitorRuntimeSettings | null;
	trigger?: Trigger;
}) {
	const fields = useMemo(
		() => serverMonitorRuntimeFieldsForServer(server.serverId),
		[server.serverId],
	);
	const [form, setForm] = useState<ServerMonitorRuntimeFormState | null>(null);
	const [isCustom, setIsCustom] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const currentOverride = settings?.serverOverrides[server.serverId];
	const currentOverrideForFields = useMemo(
		() => pickServerMonitorRuntimeOverride(currentOverride, fields),
		[currentOverride, fields],
	);
	const hasCurrentOverride =
		Object.keys(currentOverrideForFields).length > 0;
	const defaultValues = useMemo(
		() => (settings ? serverMonitorRuntimeDefaultsFromSettings(settings) : null),
		[settings],
	);
	const currentValues = useMemo(
		() =>
			settings
				? resolveServerMonitorRuntimeSettings(settings, server.serverId)
				: null,
		[server.serverId, settings],
	);

	useEffect(() => {
		if (!isOpen || !settings || !currentValues) return;

		setIsCustom(hasCurrentOverride);
		setForm(serverMonitorRuntimeFormFromValues(currentValues));
	}, [currentValues, hasCurrentOverride, isOpen, settings]);

	const draftOverride = useMemo(() => {
		if (!form) return null;
		return parseServerMonitorRuntimeForm(form, fields);
	}, [fields, form]);
	const validationError =
		isCustom && form ? validateServerMonitorRuntimeForm(form, fields) : "";
	const currentMode = hasCurrentOverride ? "custom" : "default";
	const draftMode = isCustom ? "custom" : "default";
	const isDirty =
		Boolean(settings && form) &&
		(draftMode !== currentMode ||
			(isCustom &&
				JSON.stringify(draftOverride) !==
					JSON.stringify(currentOverrideForFields)));
	const canSave =
		Boolean(settings && form) &&
		!isLoading &&
		!isSaving &&
		isDirty &&
		!validationError;

	const close = () => {
		if (isSaving) return;
		setIsOpen(false);
	};

	const updateField = (
		field: keyof ServerMonitorRuntimeFormState,
		value: string,
	) => {
		setForm((current) =>
			current
				? {
						...current,
						[field]: value,
					}
				: current,
		);
	};

	const enableCustom = () => {
		if (!currentValues) return;

		setIsCustom(true);
		setForm(serverMonitorRuntimeFormFromValues(currentValues));
	};

	const useDefaults = () => {
		if (!defaultValues) return;

		setIsCustom(false);
		setForm(serverMonitorRuntimeFormFromValues(defaultValues));
	};

	const save = async () => {
		if (!settings || !draftOverride || !canSave) return;

		const serverOverrides = { ...settings.serverOverrides };
		if (isCustom) {
			serverOverrides[server.serverId] = draftOverride;
		} else {
			delete serverOverrides[server.serverId];
		}

		const saved = await onSaveSettings({
			...settings,
			serverOverrides,
		});
		if (saved) setIsOpen(false);
	};

	return (
		<>
			{trigger === "button" ? (
				<Button
					disabled={isLoading || !settings}
					icon={TimerReset}
					onClick={() => setIsOpen(true)}
					size="lg"
				>
					Runtime
				</Button>
			) : (
				<IconButton
					disabled={isLoading || !settings}
					onClick={() => setIsOpen(true)}
					aria-label={`Open runtime settings for ${server.serverName}`}
					icon={TimerReset}
					size="sm"
				/>
			)}

			{isOpen &&
				settings &&
				form &&
				createPortal(
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
						<button
							type="button"
							className="absolute inset-0 cursor-default"
							onClick={close}
							aria-label="Close server runtime settings"
						/>
						<section
							className="relative w-full max-w-150 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
							role="dialog"
							aria-modal="true"
							aria-label={`Runtime settings for ${server.serverName}`}
						>
							<header className="flex items-start justify-between gap-3 border-b border-slate-200 px-4.5 py-4">
								<div className="min-w-0">
									<div className="flex min-w-0 flex-wrap items-center gap-2">
										<h2 className="max-w-100 overflow-hidden text-ellipsis text-lg leading-tight font-extrabold text-slate-900">
											{server.serverName}
										</h2>
										<ServerStatusBadge online={server.online} status={server.status} />
									</div>
									<p className="mt-1 text-xs font-semibold text-slate-500">
										Set monitor runtime overrides for this server.
									</p>
								</div>
								<IconButton
									onClick={close}
									aria-label="Close"
									icon={X}
									variant="danger"
								/>
							</header>

							<div className="grid gap-4 px-4.5 py-4">
								<div className="grid grid-cols-2 gap-2 max-md:grid-cols-1">
									<button
										type="button"
										className={`min-h-16 cursor-pointer rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
											!isCustom
												? "border-blue-300 bg-blue-50 text-blue-800"
												: "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50"
										}`}
										disabled={isSaving}
										onClick={useDefaults}
										aria-pressed={!isCustom}
									>
										<span className="block text-sm font-extrabold">
											Use defaults
										</span>
										<span className="mt-1 block text-xs leading-4 font-semibold opacity-75">
											Follow the shared runtime defaults.
										</span>
									</button>
									<button
										type="button"
										className={`min-h-16 cursor-pointer rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
											isCustom
												? "border-amber-300 bg-amber-50 text-amber-900"
												: "border-slate-200 bg-white text-slate-700 hover:border-amber-200 hover:bg-amber-50"
										}`}
										disabled={isSaving}
										onClick={enableCustom}
										aria-pressed={isCustom}
									>
										<span className="block text-sm font-extrabold">
											Custom runtime
										</span>
										<span className="mt-1 block text-xs leading-4 font-semibold opacity-75">
											Override runtime values for this server only.
										</span>
									</button>
								</div>

								<div className="grid grid-cols-3 gap-3 max-lg:grid-cols-1">
									{fields.map((field) => (
										<NumberInputField
											key={field.key}
											disabled={isSaving || !isCustom}
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

								{!isCustom && (
									<div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-semibold text-slate-600">
										<RotateCcw size={15} />
										This server will use the shared runtime defaults.
									</div>
								)}

								{(validationError || error) && (
									<div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-bold text-rose-800">
										{validationError || error}
									</div>
								)}
							</div>

							<footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4.5 py-3">
								<Button
									disabled={isSaving}
									onClick={close}
									size="lg"
								>
									Cancel
								</Button>
								<Button
									disabled={!canSave}
									onClick={save}
									icon={Save}
									isLoading={isSaving}
									size="lg"
									variant="accent"
								>
									Save settings
								</Button>
							</footer>
						</section>
					</div>,
					document.body,
				)}
		</>
	);
}
