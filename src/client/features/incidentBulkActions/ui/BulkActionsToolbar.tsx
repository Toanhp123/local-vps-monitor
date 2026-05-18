import { CheckCircle2, Download, Undo2, BellOff } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { SelectField } from "@/shared/ui/SelectField";
import type { SnoozePreset } from "@/entities/incident/model/incidentState";
import { snoozePresets } from "@/entities/incident/model/incidentState";

const snoozeOptions = snoozePresets.map((preset) => ({
	label: preset.label,
	value: preset.value,
}));

export function BulkActionsToolbar({
	selectedCount,
	onAcknowledge,
	onSnooze,
	onMarkRead,
	onExport,
	onClearActions,
}: {
	selectedCount: number;
	onAcknowledge: () => void;
	onSnooze: (preset: SnoozePreset) => void;
	onMarkRead: () => void;
	onExport: () => void;
	onClearActions: () => void;
}) {
	if (selectedCount === 0) return null;

	return (
		<div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-blue-50 px-4 py-3">
			<span className="text-sm font-extrabold text-slate-900">
				{selectedCount} selected
			</span>
			<div className="flex items-center gap-2">
				<Button onClick={onAcknowledge} size="sm" icon={CheckCircle2}>
					Acknowledge
				</Button>
				<div className="flex items-center gap-1">
					<span className="text-xs font-bold text-slate-600">Snooze:</span>
					<SelectField
						ariaLabel="Bulk snooze preset"
						value=""
						onChange={(value) => onSnooze(value as SnoozePreset)}
						options={snoozeOptions}
						placeholder="Select"
						buttonClassName="inline-flex h-8 min-w-28 cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-left text-xs font-bold text-slate-800 outline-0 hover:border-blue-200 hover:bg-blue-50"
					/>
				</div>
				<Button onClick={onMarkRead} size="sm" icon={BellOff}>
					Mark Read
				</Button>
				<Button onClick={onExport} size="sm" icon={Download}>
					Export
				</Button>
				<Button onClick={onClearActions} size="sm" icon={Undo2}>
					Clear Actions
				</Button>
			</div>
		</div>
	);
}
