import {
	AlertTriangle,
	BellOff,
	CheckCircle2,
	Cpu,
	HardDrive,
	Globe2,
	MemoryStick,
	PlusCircle,
	RotateCcw,
	Trash2,
	Undo2,
	type LucideIcon,
} from "lucide-react";
import type {
	IncidentEvent,
	IncidentKind,
	IncidentSeverity,
} from "@shared/types";
import {
	snoozePresets,
	type SnoozePreset,
} from "../model/incidentState";
import { relativeTime } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { SelectField } from "@/shared/ui/SelectField";

const severityLabels: Record<IncidentSeverity, string> = {
	critical: "Critical",
	info: "Info",
	resolved: "Resolved",
	warning: "Warning",
};

const severityTones: Record<
	IncidentSeverity,
	"amber" | "blue" | "green" | "red"
> = {
	critical: "red",
	info: "blue",
	resolved: "green",
	warning: "amber",
};

const iconClasses: Record<IncidentSeverity, string> = {
	critical: "bg-red-100 text-red-700",
	info: "bg-blue-50 text-blue-700",
	resolved: "bg-green-100 text-green-700",
	warning: "bg-amber-100 text-amber-700",
};

const kindIcons: Record<IncidentKind, LucideIcon> = {
	"app-added": PlusCircle,
	"app-health": AlertTriangle,
	"app-removed": Trash2,
	"app-restart": RotateCcw,
	"cpu-load": Cpu,
	"disk-usage": HardDrive,
	"http-check": Globe2,
	"memory-usage": MemoryStick,
};

const resolvedIcons: Partial<Record<IncidentKind, LucideIcon>> = {
	"app-health": CheckCircle2,
	"cpu-load": CheckCircle2,
	"disk-usage": CheckCircle2,
	"http-check": CheckCircle2,
	"memory-usage": CheckCircle2,
};

const formatSnoozedUntil = (snoozedUntil: number) => {
	return new Intl.DateTimeFormat(undefined, {
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		month: "short",
	}).format(new Date(snoozedUntil));
};
const snoozeOptions = snoozePresets.map((preset) => ({
	label: preset.label,
	value: preset.value,
}));

export function IncidentListItem({
	incident,
	isAcknowledged,
	isUnread,
	now,
	onAcknowledge,
	onClearAction,
	onSnooze,
	snoozedUntil,
}: {
	incident: IncidentEvent;
	isAcknowledged: boolean;
	isUnread: boolean;
	now: number;
	onAcknowledge: () => void;
	onClearAction: () => void;
	onSnooze: (preset: SnoozePreset) => void;
	snoozedUntil?: number;
}) {
	const Icon =
		incident.severity === "resolved"
			? resolvedIcons[incident.kind] || CheckCircle2
			: kindIcons[incident.kind];
	const isMuted = isAcknowledged || snoozedUntil !== undefined;

	return (
		<li className="grid grid-cols-[auto_1fr] gap-3 px-4.5 py-4">
			<span
				className={`mt-0.5 flex h-8.5 w-8.5 items-center justify-center rounded-lg ${
					iconClasses[incident.severity]
				}`}
			>
				<Icon size={17} />
			</span>
			<div className="min-w-0">
				<div className="flex min-w-0 flex-wrap items-center gap-2">
					<strong className="min-w-0 wrap-break-word text-slate-900">
						{incident.title}
					</strong>
					{isUnread && !isMuted && (
						<Badge
							className="bg-blue-600 text-white"
							size="xs"
						>
							New
						</Badge>
					)}
					{isAcknowledged && (
						<Badge className="text-slate-600" size="xs">
							Acknowledged
						</Badge>
					)}
					{snoozedUntil !== undefined && (
						<Badge
							size="xs"
							title={new Date(snoozedUntil).toLocaleString()}
							tone="violet"
						>
							Snoozed until {formatSnoozedUntil(snoozedUntil)}
						</Badge>
					)}
					<Badge tone={severityTones[incident.severity]}>
						{severityLabels[incident.severity]}
					</Badge>
				</div>
				<div className="mt-1 text-xs font-bold text-slate-400">
					{relativeTime(incident.occurredAt, now)}
				</div>
				<p className="mt-2 min-w-0 wrap-break-word text-sm font-semibold text-slate-500">
					{incident.message}
				</p>
				<div className="mt-3 flex flex-wrap items-center gap-2">
					{isMuted ? (
						<Button
							onClick={onClearAction}
							icon={Undo2}
							size="sm"
						>
							Restore
						</Button>
					) : (
						<>
							<Button
								onClick={onAcknowledge}
								icon={CheckCircle2}
								size="sm"
							>
								Acknowledge
							</Button>
							<SelectField
								ariaLabel={`Snooze ${incident.title}`}
								buttonClassName="inline-flex min-h-8 cursor-pointer items-center justify-between gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-extrabold text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
								leadingIcon={<BellOff size={14} />}
								onChange={(value) => onSnooze(value as SnoozePreset)}
								options={snoozeOptions}
								placeholder="Snooze"
								value=""
							/>
						</>
					)}
				</div>
			</div>
		</li>
	);
}
