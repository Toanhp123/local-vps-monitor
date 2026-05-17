import { Cpu, HardDrive, MemoryStick, type LucideIcon } from "lucide-react";
import { NumberInputField } from "@/shared/ui/NumberInputField";
import type {
	ServerAlertResourceConfig,
	ServerAlertResourceId,
	ThresholdFormState,
} from "../model/serverAlertPolicyForm";

const resourceIcons: Record<ServerAlertResourceId, LucideIcon> = {
	cpuLoad: Cpu,
	disk: HardDrive,
	memory: MemoryStick,
};

export function ServerAlertThresholdGroup({
	disabled,
	form,
	onChange,
	resource,
}: {
	disabled: boolean;
	form: ThresholdFormState;
	onChange: (field: keyof ThresholdFormState, value: string) => void;
	resource: ServerAlertResourceConfig;
}) {
	const Icon = resourceIcons[resource.id];

	return (
		<div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
			<div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
				<Icon size={14} />
				{resource.label}
			</div>
			<div className="grid grid-cols-2 gap-2">
				<NumberInputField
					disabled={disabled}
					label="Warning"
					max={resource.max}
					min={1}
					onChange={(value) => onChange(resource.warningKey, value)}
					size="sm"
					step={0.1}
					unit="%"
					value={form[resource.warningKey]}
				/>
				<NumberInputField
					disabled={disabled}
					label="Critical"
					max={resource.max}
					min={1}
					onChange={(value) => onChange(resource.criticalKey, value)}
					size="sm"
					step={0.1}
					unit="%"
					value={form[resource.criticalKey]}
				/>
			</div>
		</div>
	);
}
