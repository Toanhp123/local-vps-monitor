import {
	AlertTriangle,
	CheckCircle2,
	PlusCircle,
	RotateCcw,
	Trash2,
	type LucideIcon,
} from "lucide-react";
import type {
	IncidentEvent,
	IncidentKind,
	IncidentSeverity,
} from "../../../../shared/types";
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
};

const resolvedIcons: Partial<Record<IncidentKind, LucideIcon>> = {
	"app-health": CheckCircle2,
};

export function IncidentListItem({
	incident,
	isUnread,
	now,
}: {
	incident: IncidentEvent;
	isUnread: boolean;
	now: number;
}) {
	const Icon =
		incident.severity === "resolved"
			? resolvedIcons[incident.kind] || CheckCircle2
			: kindIcons[incident.kind];

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
					{isUnread && (
						<span className="inline-flex min-h-5 items-center rounded-full bg-blue-600 px-2 text-[10px] font-extrabold text-white">
							New
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
			</div>
		</li>
	);
}
