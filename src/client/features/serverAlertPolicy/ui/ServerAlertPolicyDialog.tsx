import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { BellRing, RotateCcw, Save, X } from "lucide-react";
import type {
	ServerAlertPolicy,
	ServerAlertPolicyUpdateInput,
	StoredServer,
} from "@shared/types";
import { Button } from "@/shared/ui/Button";
import { IconButton } from "@/shared/ui/IconButton";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import {
	parseThresholdForm,
	serverAlertResources,
	thresholdFormFromValues,
	validateThresholds,
	type ThresholdFormState,
} from "../model/serverAlertPolicyForm";
import { ServerAlertThresholdGroup } from "./ServerAlertThresholdGroup";

type Trigger = "button" | "icon";

export function ServerAlertPolicyDialog({
	error,
	isLoading,
	isSaving,
	onSavePolicy,
	policy,
	server,
	trigger = "icon",
}: {
	error?: string;
	isLoading: boolean;
	isSaving: boolean;
	onSavePolicy: (input: ServerAlertPolicyUpdateInput) => Promise<boolean>;
	policy: ServerAlertPolicy | null;
	server: StoredServer;
	trigger?: Trigger;
}) {
	const [form, setForm] = useState<ThresholdFormState | null>(null);
	const [isCustom, setIsCustom] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const currentOverride = policy?.serverOverrides[server.serverId];
	const currentThresholds = currentOverride ?? policy?.defaults;

	useEffect(() => {
		if (!isOpen || !policy || !currentThresholds) return;

		setIsCustom(Boolean(currentOverride));
		setForm(thresholdFormFromValues(currentThresholds));
	}, [currentOverride, currentThresholds, isOpen, policy]);

	const draftThresholds = useMemo(() => {
		if (!form) return null;
		return parseThresholdForm(form);
	}, [form]);
	const validationError =
		isCustom && draftThresholds ? validateThresholds(draftThresholds) : "";
	const currentPolicyForServer = currentOverride ? "custom" : "default";
	const draftPolicyForServer = isCustom ? "custom" : "default";
	const isDirty =
		Boolean(policy && form) &&
		(draftPolicyForServer !== currentPolicyForServer ||
			(isCustom &&
				JSON.stringify(draftThresholds) !==
					JSON.stringify(currentThresholds)));
	const canSave =
		Boolean(policy && form) &&
		!isLoading &&
		!isSaving &&
		isDirty &&
		!validationError;

	const close = () => {
		if (isSaving) return;
		setIsOpen(false);
	};

	const updateField = (field: keyof ThresholdFormState, value: string) => {
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
		if (!policy) return;
		setIsCustom(true);
		setForm(thresholdFormFromValues(currentThresholds ?? policy.defaults));
	};

	const useDefault = () => {
		if (!policy) return;
		setIsCustom(false);
		setForm(thresholdFormFromValues(policy.defaults));
	};

	const save = async () => {
		if (!policy || !draftThresholds || !canSave) return;

		const serverOverrides = { ...policy.serverOverrides };
		if (isCustom) {
			serverOverrides[server.serverId] = draftThresholds;
		} else {
			delete serverOverrides[server.serverId];
		}

		const saved = await onSavePolicy({
			defaults: policy.defaults,
			serverOverrides,
		});
		if (saved) setIsOpen(false);
	};

	return (
		<>
			{trigger === "button" ? (
				<Button
					disabled={isLoading || !policy}
					icon={BellRing}
					onClick={() => setIsOpen(true)}
					size="lg"
				>
					Alerts
				</Button>
			) : (
				<IconButton
					disabled={isLoading || !policy}
					onClick={() => setIsOpen(true)}
					aria-label={`Open alert settings for ${server.serverName}`}
					icon={BellRing}
					size="sm"
				/>
			)}

			{isOpen &&
				policy &&
				form &&
				createPortal(
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
						<button
							type="button"
							className="absolute inset-0 cursor-default"
							onClick={close}
							aria-label="Close server alert settings"
						/>
						<section
							className="relative w-full max-w-155 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
							role="dialog"
							aria-modal="true"
							aria-label={`Alert settings for ${server.serverName}`}
						>
							<header className="flex items-start justify-between gap-3 border-b border-slate-200 px-4.5 py-4">
								<div className="min-w-0">
									<div className="flex min-w-0 flex-wrap items-center gap-2">
										<h2 className="max-w-100 overflow-hidden text-ellipsis text-lg leading-tight font-extrabold text-slate-900">
											{server.serverName}
										</h2>
										<StatusBadge status={server.status} />
									</div>
									<p className="mt-1 text-xs font-semibold text-slate-500">
										Set resource alert thresholds for this server.
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
										onClick={useDefault}
										aria-pressed={!isCustom}
									>
										<span className="block text-sm font-extrabold">
											Use default
										</span>
										<span className="mt-1 block text-xs leading-4 font-semibold opacity-75">
											Follow the shared alert policy.
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
											Custom thresholds
										</span>
										<span className="mt-1 block text-xs leading-4 font-semibold opacity-75">
											Override thresholds for this server only.
										</span>
									</button>
								</div>

								<div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
									{serverAlertResources.map((resource) => (
										<ServerAlertThresholdGroup
											key={resource.id}
											disabled={isSaving || !isCustom}
											form={form}
											onChange={updateField}
											resource={resource}
										/>
									))}
								</div>

								{!isCustom && (
									<div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-semibold text-slate-600">
										<RotateCcw size={15} />
										This server will use the shared default thresholds.
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
