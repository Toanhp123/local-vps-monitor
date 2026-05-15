import {
	AlertTriangle,
	BellOff,
	CheckCircle2,
	HardDrive,
	PlusCircle,
	RotateCcw,
	Trash2,
	Undo2,
	type LucideIcon,
} from "lucide-react";
import type { ChangeEvent } from "react";
import type {
	IncidentEvent,
	IncidentKind,
	IncidentSeverity,
} from "../../../../shared/types";
import {
	snoozePresets,
	type SnoozePreset,
} from "../model/incidentActions";
import { relativeTime } from "../../../shared/lib/format";

const severityLabels: Record<IncidentSeverity, string> = {
	critical: "Critical",
	info: "Info",
	resolved: "Resolved",
	warning: "Warning",
};

const severityClasses: Record<IncidentSeverity, string> = {
	critical: "bg-red-100 text-red-800",
	info: "bg-blue-50 text-blue-700",
	resolved: "bg-green-100 text-green-800",
	warning: "bg-amber-100 text-amber-800",
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
	"disk-usage": HardDrive,
};

const resolvedIcons: Partial<Record<IncidentKind, LucideIcon>> = {
	"app-health": CheckCircle2,
	"disk-usage": CheckCircle2,
};

const formatSnoozedUntil = (snoozedUntil: number) => {
	return new Intl.DateTimeFormat(undefined, {
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		month: "short",
	}).format(new Date(snoozedUntil));
};

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
	const handleSnoozeChange = (event: ChangeEvent<HTMLSelectElement>) => {
		const preset = event.currentTarget.value as SnoozePreset | "";
		if (!preset) return;

		onSnooze(preset);
		event.currentTarget.value = "";
	};

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
						<span className="inline-flex min-h-5 items-center rounded-full bg-blue-600 px-2 text-[10px] font-extrabold text-white">
							New
						</span>
					)}
					{isAcknowledged && (
						<span className="inline-flex min-h-5 items-center rounded-full bg-slate-100 px-2 text-[10px] font-extrabold text-slate-600">
							Acknowledged
						</span>
					)}
					{snoozedUntil !== undefined && (
						<span
							className="inline-flex min-h-5 items-center rounded-full bg-violet-50 px-2 text-[10px] font-extrabold text-violet-700"
							title={new Date(snoozedUntil).toLocaleString()}
						>
							Snoozed until {formatSnoozedUntil(snoozedUntil)}
						</span>
					)}
					<span
						className={`inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-extrabold ${
							severityClasses[incident.severity]
						}`}
					>
						{severityLabels[incident.severity]}
					</span>
				</div>
				<div className="mt-1 text-xs font-bold text-slate-400">
					{relativeTime(incident.occurredAt, now)}
				</div>
				<p className="mt-2 min-w-0 wrap-break-word text-sm font-semibold text-slate-500">
					{incident.message}
				</p>
				<div className="mt-3 flex flex-wrap items-center gap-2">
					{isMuted ? (
						<button
							type="button"
							className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-extrabold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
							onClick={onClearAction}
						>
							<Undo2 size={14} />
							Restore
						</button>
					) : (
						<>
							<button
								type="button"
								className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-extrabold text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
								onClick={onAcknowledge}
							>
								<CheckCircle2 size={14} />
								Acknowledge
							</button>
							<label className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-extrabold text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700">
								<BellOff size={14} />
								<select
									className="cursor-pointer bg-transparent font-extrabold outline-none"
									defaultValue=""
									onChange={handleSnoozeChange}
									aria-label={`Snooze ${incident.title}`}
								>
									<option value="" disabled>
										Snooze
									</option>
									{snoozePresets.map((preset) => (
										<option
											key={preset.value}
											value={preset.value}
										>
											{preset.label}
										</option>
									))}
								</select>
							</label>
						</>
					)}
				</div>
			</div>
		</li>
	);
}
