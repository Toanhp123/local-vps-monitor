import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	AlertTriangle,
	Bell,
	ChevronDown,
	ChevronUp,
	CheckCircle2,
	Clock,
	PlusCircle,
	RotateCcw,
	Server,
	Trash2,
	X,
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

const sortIncidents = (incidents: IncidentEvent[]) => {
	return [...incidents].sort(
		(left, right) =>
			new Date(right.occurredAt).getTime() -
			new Date(left.occurredAt).getTime(),
	);
};

const visibleBadgeCount = (count: number) => {
	return count > 99 ? "99+" : String(count);
};

const drawerAnimationMs = 180;

interface IncidentGroup {
	activeCount: number;
	incidents: IncidentEvent[];
	latestAt: string;
	serverId: string;
	serverName: string;
}

const groupIncidentsByServer = (incidents: IncidentEvent[]) => {
	const groups = new Map<string, IncidentGroup>();

	for (const incident of sortIncidents(incidents)) {
		const current = groups.get(incident.serverId);

		if (current) {
			current.incidents.push(incident);
			continue;
		}

		groups.set(incident.serverId, {
			activeCount: 0,
			incidents: [incident],
			latestAt: incident.occurredAt,
			serverId: incident.serverId,
			serverName: incident.serverName,
		});
	}

	const incidentGroups = Array.from(groups.values());

	for (const group of incidentGroups) {
		group.activeCount = group.incidents.filter(
			(incident) =>
				incident.severity === "critical" ||
				incident.severity === "warning",
		).length;
	}

	return incidentGroups.sort(
		(left, right) =>
			new Date(right.latestAt).getTime() -
			new Date(left.latestAt).getTime(),
	);
};

export function IncidentNotificationCenter({
	incidents,
	now,
}: {
	incidents: IncidentEvent[];
	now: number;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [isClosing, setIsClosing] = useState(false);
	const [expandedServerId, setExpandedServerId] = useState<string | null>(null);
	const closeTimerRef = useRef<number | null>(null);
	const incidentGroups = useMemo(
		() => groupIncidentsByServer(incidents),
		[incidents],
	);
	const activeCount = incidents.filter(
		(incident) =>
			incident.severity === "critical" || incident.severity === "warning",
	).length;
	const badgeCount = activeCount || incidents.length;

	const openDrawer = useCallback(() => {
		if (closeTimerRef.current) {
			window.clearTimeout(closeTimerRef.current);
			closeTimerRef.current = null;
		}

		setIsClosing(false);
		setIsOpen(true);
	}, []);

	const closeDrawer = useCallback(() => {
		if (!isOpen || isClosing) return;

		setIsClosing(true);
		if (closeTimerRef.current) {
			window.clearTimeout(closeTimerRef.current);
		}

		closeTimerRef.current = window.setTimeout(() => {
			setIsOpen(false);
			setIsClosing(false);
			closeTimerRef.current = null;
		}, drawerAnimationMs);
	}, [isClosing, isOpen]);

	useEffect(() => {
		if (!isOpen) return undefined;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") closeDrawer();
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [closeDrawer, isOpen]);

	useEffect(() => {
		return () => {
			if (closeTimerRef.current) {
				window.clearTimeout(closeTimerRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (!isOpen || incidentGroups.length === 0) return;

		if (!expandedServerId) {
			setExpandedServerId(incidentGroups[0].serverId);
			return;
		}

		if (!incidentGroups.some((group) => group.serverId === expandedServerId)) {
			setExpandedServerId(incidentGroups[0].serverId);
		}
	}, [expandedServerId, incidentGroups, isOpen]);

	return (
		<>
			<button
				type="button"
				className="relative inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
				onClick={openDrawer}
				aria-label="Open incident notifications"
			>
				<Bell size={17} />
				{badgeCount > 0 && (
					<span
						className={`absolute -top-1 -right-1 flex min-h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] leading-none font-extrabold text-white ring-2 ring-white ${
							activeCount > 0 ? "bg-red-600" : "bg-slate-700"
						}`}
					>
						{visibleBadgeCount(badgeCount)}
					</span>
				)}
			</button>

			{isOpen && (
				<div className="fixed inset-0 z-50">
					<button
						type="button"
						className={`incident-backdrop absolute inset-0 cursor-default bg-slate-900/30 ${
							isClosing ? "is-closing" : ""
						}`}
						onClick={closeDrawer}
						aria-label="Close incident notifications"
					/>
					<aside
						className={`incident-drawer absolute top-0 right-0 flex h-full w-full max-w-115 flex-col border-l border-slate-200 bg-white shadow-2xl shadow-slate-950/25 ${
							isClosing ? "is-closing" : ""
						}`}
						role="dialog"
						aria-modal="true"
						aria-label="Incident notifications"
					>
						<div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4.5 py-4">
							<div className="min-w-0">
								<div className="flex items-center gap-2">
									<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
										<Bell size={17} />
									</span>
									<div className="min-w-0">
										<h2 className="text-lg leading-tight font-extrabold text-slate-900">
											Incidents
										</h2>
										<p className="mt-0.5 text-sm font-semibold text-slate-500">
											{incidents.length} recorded events
										</p>
									</div>
								</div>
							</div>
							<button
								type="button"
								className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
								onClick={closeDrawer}
								aria-label="Close"
							>
								<X size={17} />
							</button>
						</div>

						<div className="min-h-0 flex-1 overflow-y-auto">
							{incidentGroups.length === 0 ? (
								<div className="flex min-h-44 flex-col items-center justify-center gap-2 px-6 text-center text-sm font-semibold text-slate-500">
									<Clock size={20} />
									No incidents recorded
								</div>
							) : (
								<div className="divide-y divide-slate-200">
									{incidentGroups.map((group) => {
										const isExpanded =
											expandedServerId === group.serverId;

										return (
											<section key={group.serverId}>
												<button
													type="button"
													className="sticky top-0 z-10 flex w-full cursor-pointer items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4.5 py-2.5 text-left hover:bg-blue-50"
													onClick={() =>
														setExpandedServerId(
															isExpanded
																? null
																: group.serverId,
														)
													}
													aria-expanded={isExpanded}
												>
													<div className="flex min-w-0 items-center gap-2">
														<span className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600">
															<Server size={15} />
														</span>
														<div className="min-w-0">
															<strong className="block overflow-hidden text-sm text-ellipsis whitespace-nowrap text-slate-900">
																{group.serverName}
															</strong>
															<span className="text-xs font-bold text-slate-400">
																Latest{" "}
																{relativeTime(
																	group.latestAt,
																	now,
																)}
															</span>
														</div>
													</div>
													<div className="flex shrink-0 items-center gap-2">
														{group.activeCount > 0 && (
															<span className="inline-flex min-h-6 items-center rounded-full bg-red-100 px-2.5 text-xs font-extrabold text-red-700">
																{group.activeCount}
															</span>
														)}
														<span className="inline-flex min-h-6 items-center rounded-full bg-white px-2.5 text-xs font-extrabold text-slate-600">
															{group.incidents.length}
														</span>
														{isExpanded ? (
															<ChevronUp
																size={16}
																className="text-slate-500"
															/>
														) : (
															<ChevronDown
																size={16}
																className="text-slate-500"
															/>
														)}
													</div>
												</button>
												{isExpanded && (
													<ol className="divide-y divide-slate-100">
														{group.incidents.map(
															(incident) => {
																const Icon =
																	incident.severity ===
																	"resolved"
																		? resolvedIcons[
																				incident
																					.kind
																			] ||
																			CheckCircle2
																		: kindIcons[
																				incident
																					.kind
																			];

																return (
																	<li
																		key={
																			incident.id
																		}
																		className="grid grid-cols-[auto_1fr] gap-3 px-4.5 py-4"
																	>
																		<span
																			className={`mt-0.5 flex h-8.5 w-8.5 items-center justify-center rounded-lg ${iconClasses[incident.severity]}`}
																		>
																			<Icon
																				size={
																					17
																				}
																			/>
																		</span>
																		<div className="min-w-0">
																			<div className="flex min-w-0 flex-wrap items-center gap-2">
																				<strong className="min-w-0 break-words text-slate-900">
																					{
																						incident.title
																					}
																				</strong>
																				<span
																					className={`inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-extrabold ${severityClasses[incident.severity]}`}
																				>
																					{
																						severityLabels[
																							incident
																								.severity
																						]
																					}
																				</span>
																			</div>
																			<div className="mt-1 text-xs font-bold text-slate-400">
																				{relativeTime(
																					incident.occurredAt,
																					now,
																				)}
																			</div>
																			<p className="mt-2 min-w-0 break-words text-sm font-semibold text-slate-500">
																				{
																					incident.message
																				}
																			</p>
																		</div>
																	</li>
																);
															},
														)}
													</ol>
												)}
											</section>
										);
									})}
								</div>
							)}
						</div>
					</aside>
				</div>
			)}
		</>
	);
}
