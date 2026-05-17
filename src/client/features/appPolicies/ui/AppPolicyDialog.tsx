import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
	Activity,
	EyeOff,
	Save,
	Settings,
	ShieldAlert,
	X,
	type LucideIcon,
} from "lucide-react";
import type {
	AppImportance,
	AppPolicyOverrideInput,
	AppSnapshot,
} from "@shared/types";
import {
	appDisplayName,
	appImportance,
} from "@/entities/application";
import { RuntimeBadge } from "@/entities/application";
import { Button } from "@/shared/ui/Button";
import { IconButton } from "@/shared/ui/IconButton";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { TextInputField } from "@/shared/ui/TextInputField";

const importanceOptions: Array<{
	description: string;
	icon: LucideIcon;
	label: string;
	selectedClass: string;
	value: AppImportance;
}> = [
	{
		description: "Counts in health and escalates down incidents.",
		icon: ShieldAlert,
		label: "Critical",
		selectedClass: "border-red-300 bg-red-50 text-red-800",
		value: "critical",
	},
	{
		description: "Included in dashboard health counts.",
		icon: Activity,
		label: "Normal",
		selectedClass: "border-blue-300 bg-blue-50 text-blue-800",
		value: "normal",
	},
	{
		description: "Excluded from health, incidents, and counts.",
		icon: EyeOff,
		label: "Ignored",
		selectedClass: "border-slate-300 bg-slate-100 text-slate-700",
		value: "ignored",
	},
];

export function AppPolicyDialog({
	app,
	isSaving,
	onSave,
	serverId,
}: {
	app: AppSnapshot;
	isSaving: boolean;
	onSave: (input: AppPolicyOverrideInput) => Promise<boolean>;
	serverId: string;
}) {
	const [displayName, setDisplayName] = useState(
		app.monitoring?.displayName ?? "",
	);
	const [importance, setImportance] = useState<AppImportance>(
		appImportance(app),
	);
	const [isOpen, setIsOpen] = useState(false);
	const currentDisplayName = app.monitoring?.displayName ?? "";
	const currentImportance = appImportance(app);
	const isDirty =
		displayName.trim() !== currentDisplayName ||
		importance !== currentImportance;

	useEffect(() => {
		if (!isOpen) return;

		setDisplayName(app.monitoring?.displayName ?? "");
		setImportance(appImportance(app));
	}, [app, isOpen]);

	const close = () => {
		if (isSaving) return;
		setIsOpen(false);
	};

	const save = async () => {
		const saved = await onSave({
			appId: app.id,
			appKind: app.kind,
			appName: app.name,
			displayName,
			importance,
			serverId,
		});

		if (saved) setIsOpen(false);
	};

	return (
		<>
			<IconButton
				onClick={() => setIsOpen(true)}
				aria-label={`Open policy settings for ${appDisplayName(app)}`}
				icon={Settings}
				size="sm"
			/>

			{isOpen &&
				createPortal(
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
						<button
							type="button"
							className="absolute inset-0 cursor-default"
							onClick={close}
							aria-label="Close app policy settings"
						/>
						<section
							className="relative w-full max-w-135 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
							role="dialog"
							aria-modal="true"
							aria-label={`Policy settings for ${appDisplayName(app)}`}
						>
							<header className="flex items-start justify-between gap-3 border-b border-slate-200 px-4.5 py-4">
								<div className="min-w-0">
									<div className="flex min-w-0 flex-wrap items-center gap-2">
										<h2 className="max-w-88 overflow-hidden text-ellipsis text-lg leading-tight font-extrabold text-slate-900">
											{appDisplayName(app)}
										</h2>
										<RuntimeBadge kind={app.kind} />
										<StatusBadge status={app.health} />
									</div>
									<p className="mt-1 text-xs font-semibold text-slate-500">
										Set how this app affects health and incident priority.
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
								<div className="grid gap-2">
									<span className="text-xs font-bold text-slate-500">
										Importance
									</span>
									<div className="grid grid-cols-3 gap-2 max-md:grid-cols-1">
										{importanceOptions.map((option) => {
											const Icon = option.icon;
											const isSelected =
												importance === option.value;

											return (
												<button
													key={option.value}
													type="button"
													className={`min-h-24 cursor-pointer rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
														isSelected
															? option.selectedClass
															: "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50"
													}`}
													disabled={isSaving}
													onClick={() =>
														setImportance(option.value)
													}
													aria-pressed={isSelected}
												>
													<span className="flex items-center gap-2 text-sm font-extrabold">
														<Icon size={16} />
														{option.label}
													</span>
													<span className="mt-2 block text-xs leading-4 font-semibold opacity-75">
														{option.description}
													</span>
												</button>
											);
										})}
									</div>
								</div>

								<TextInputField
									disabled={isSaving}
									helper="Alias only changes labels in the UI and incidents."
									inputClassName="text-slate-800"
									label="Display alias"
									labelClassName="text-xs font-bold text-slate-500"
									maxLength={120}
									onChange={setDisplayName}
									placeholder={app.name}
									value={displayName}
								/>
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
									disabled={isSaving || !isDirty}
									onClick={save}
									icon={Save}
									isLoading={isSaving}
									size="lg"
									variant="accent"
								>
									Save policy
								</Button>
							</footer>
						</section>
					</div>,
					document.body,
				)}
		</>
	);
}
