import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Bell } from "lucide-react";
import type { IncidentEvent, IncidentSeverity } from "@shared/types";
import { routes } from "@/shared/config/routes";
import { relativeTime } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { isIncidentNew } from "../model/incidentState";
import {
	getUnreadIncidentStats,
	sortIncidents,
	visibleBadgeCount,
} from "../model/incidentGroups";
import { useIncidentDrawerState } from "../model/useIncidentDrawerState";

const previewLimit = 3;

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

export function IncidentNotificationCenter({
	incidents,
	now,
}: {
	incidents: IncidentEvent[];
	now: number;
}) {
	const navigate = useNavigate();
	const popoverRef = useRef<HTMLDivElement | null>(null);
	const [isOpen, setIsOpen] = useState(false);
	const { incidentState, markIncidentsRead, readIncidentIds } =
		useIncidentDrawerState(incidents, now);
	const isUnreadIncident = useCallback(
		(incident: IncidentEvent) =>
			isIncidentNew(incident, readIncidentIds, incidentState, now),
		[incidentState, now, readIncidentIds],
	);
	const unreadStats = useMemo(
		() =>
			getUnreadIncidentStats(incidents, readIncidentIds, isUnreadIncident),
		[incidents, isUnreadIncident, readIncidentIds],
	);
	const previewIncidents = useMemo(
		() => sortIncidents(incidents).slice(0, previewLimit),
		[incidents],
	);
	const previewIncidentIds = useMemo(
		() => previewIncidents.map((incident) => incident.id),
		[previewIncidents],
	);

	const closePopover = useCallback(() => {
		setIsOpen(false);
	}, []);

	const togglePopover = useCallback(() => {
		setIsOpen((current) => {
			const next = !current;
			if (next) markIncidentsRead(previewIncidentIds);
			return next;
		});
	}, [markIncidentsRead, previewIncidentIds]);

	const openIncidentPage = useCallback(() => {
		markIncidentsRead(previewIncidentIds);
		closePopover();
		navigate(routes.incidents);
	}, [closePopover, markIncidentsRead, navigate, previewIncidentIds]);

	useEffect(() => {
		if (!isOpen) return undefined;

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target as Node;
			if (popoverRef.current?.contains(target)) return;

			closePopover();
		};
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") closePopover();
		};

		window.addEventListener("pointerdown", handlePointerDown);
		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("pointerdown", handlePointerDown);
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [closePopover, isOpen]);

	return (
		<div ref={popoverRef} className="relative">
			<button
				type="button"
				className="relative inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
				onClick={togglePopover}
				aria-label="Open incident notifications"
				aria-expanded={isOpen}
				aria-haspopup="dialog"
			>
				<Bell size={17} />
				{unreadStats.count > 0 && (
					<span
						className={`absolute -top-1 -right-1 flex min-h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] leading-none font-extrabold text-white ring-2 ring-white ${
							unreadStats.activeCount > 0
								? "bg-red-600"
								: "bg-slate-700"
						}`}
					>
						{visibleBadgeCount(unreadStats.count)}
					</span>
				)}
			</button>

			{isOpen && (
				<div
					className="absolute top-full right-0 z-50 mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-950/15"
					role="dialog"
					aria-label="Recent incidents"
				>
					<div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
						<div className="min-w-0">
							<div className="text-sm font-extrabold text-slate-900">
								Recent incidents
							</div>
							<div className="mt-0.5 text-xs font-semibold text-slate-500">
								{unreadStats.count > 0
									? `${unreadStats.count} unread`
									: "No unread incidents"}
							</div>
						</div>
						<Button onClick={openIncidentPage} size="sm" icon={ArrowRight}>
							View all
						</Button>
					</div>

					{previewIncidents.length === 0 ? (
						<div className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
							No incidents
						</div>
					) : (
						<div className="max-h-80 overflow-y-auto">
							{previewIncidents.map((incident) => {
								const isUnread = isUnreadIncident(incident);

								return (
									<button
										key={incident.id}
										type="button"
										onClick={openIncidentPage}
										className="grid w-full cursor-pointer grid-cols-[auto_1fr] gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
									>
										<span
											className={`mt-1 h-2.5 w-2.5 rounded-full ${
												isUnread ? "bg-blue-600" : "bg-slate-300"
											}`}
										/>
										<span className="min-w-0">
											<span className="flex min-w-0 items-center gap-2">
												<strong className="min-w-0 truncate text-sm text-slate-900">
													{incident.title}
												</strong>
												<Badge
													size="xs"
													tone={severityTones[incident.severity]}
												>
													{severityLabels[incident.severity]}
												</Badge>
											</span>
											<span className="mt-1 block truncate text-xs font-bold text-slate-500">
												{incident.serverName}
												{incident.appName ? ` / ${incident.appName}` : ""}
												{" - "}
												{relativeTime(incident.occurredAt, now)}
											</span>
											<span className="mt-1 line-clamp-2 text-sm font-semibold text-slate-600">
												{incident.message}
											</span>
										</span>
									</button>
								);
							})}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
