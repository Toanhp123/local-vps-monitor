import { useEffect, useMemo, useState, type FormEvent } from "react";
import { BellRing, Cpu, HardDrive, MemoryStick } from "lucide-react";
import type {
	ServerAlertPolicy,
	ServerAlertPolicyUpdateInput,
} from "@shared/types";
import { Badge } from "@/shared/ui/Badge";
import { SettingsPanelFrame } from "@/shared/ui/SettingsPanelFrame";
import {
	emptyThresholdForm,
	parseThresholdForm,
	serverAlertResources,
	thresholdFormFromValues,
	validateThresholds,
	type ThresholdFormState,
} from "@/features/serverAlertPolicy";
import { ServerAlertThresholdGroup } from "@/features/serverAlertPolicy";

const thresholdSummary = (
	warning: number | undefined,
	critical: number | undefined,
) => {
	if (warning === undefined || critical === undefined) return "--";

	return `${warning}/${critical}%`;
};

export function ServerAlertDefaultsPanel({
	error,
	isLoading,
	isSaving,
	onSavePolicy,
	policy,
}: {
	error: string;
	isLoading: boolean;
	isSaving: boolean;
	onSavePolicy: (input: ServerAlertPolicyUpdateInput) => Promise<boolean>;
	policy: ServerAlertPolicy | null;
}) {
	const [form, setForm] = useState<ThresholdFormState>(() =>
		emptyThresholdForm(),
	);

	useEffect(() => {
		if (!policy) return;

		setForm(thresholdFormFromValues(policy.defaults));
	}, [policy]);

	const draftThresholds = useMemo(() => parseThresholdForm(form), [form]);
	const validationError = useMemo(
		() => validateThresholds(draftThresholds),
		[draftThresholds],
	);
	const isDirty =
		policy !== null &&
		JSON.stringify(draftThresholds) !== JSON.stringify(policy.defaults);
	const canSave = !isLoading && !isSaving && isDirty && !validationError;

	const updateField = (field: keyof ThresholdFormState, value: string) => {
		setForm((current) => ({
			...current,
			[field]: value,
		}));
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!policy || !canSave) return;

		void onSavePolicy({
			defaults: draftThresholds,
			serverOverrides: policy.serverOverrides,
		});
	};

	return (
		<SettingsPanelFrame
			badges={
				<>
					<Badge icon={HardDrive} tone="blue">
						Disk{" "}
						{thresholdSummary(
							policy?.defaults.diskWarningPercent,
							policy?.defaults.diskCriticalPercent,
						)}
					</Badge>
					<Badge icon={MemoryStick} tone="violet">
						Memory{" "}
						{thresholdSummary(
							policy?.defaults.memoryWarningPercent,
							policy?.defaults.memoryCriticalPercent,
						)}
					</Badge>
					<Badge icon={Cpu} tone="amber">
						CPU{" "}
						{thresholdSummary(
							policy?.defaults.cpuLoadWarningPercent,
							policy?.defaults.cpuLoadCriticalPercent,
						)}
					</Badge>
				</>
			}
			canSave={canSave}
			description="Default resource thresholds for servers without custom alert settings."
			error={error}
			icon={<BellRing size={18} />}
			iconClassName="bg-amber-50 text-amber-700"
			isLoading={isLoading}
			isSaving={isSaving}
			loadingText="Loading alert defaults"
			onSubmit={handleSubmit}
			title="Alert Defaults"
		>
			<div className="grid grid-cols-2 gap-3 max-lg:grid-cols-1">
				{serverAlertResources.map((resource) => (
					<ServerAlertThresholdGroup
						key={resource.id}
						disabled={isSaving}
						form={form}
						onChange={updateField}
						resource={resource}
					/>
				))}
			</div>

			{validationError && (
				<div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-bold text-rose-800">
					{validationError}
				</div>
			)}
		</SettingsPanelFrame>
	);
}
