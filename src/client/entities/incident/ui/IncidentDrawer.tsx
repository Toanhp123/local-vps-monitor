import {
	Bell,
	ChevronDown,
	ChevronUp,
	Clock,
	Server,
	X,
} from "lucide-react";
import {
	getIncidentSnoozedUntil,
	isIncidentAcknowledged,
	type IncidentDrawerState,
	type IncidentDrawerFilter,
	type IncidentFilterCounts,
	type SnoozePreset,
} from "../model/incidentState";
import type { IncidentGroup } from "../model/incidentGroups";
import { relativeTime } from "../../../shared/lib/format";
import { Button } from "../../../shared/ui/Button";
import { IconButton } from "../../../shared/ui/IconButton";
import { IncidentListItem } from "./IncidentListItem";

const filterOptions: Array<{
	countKey: keyof IncidentFilterCounts;
	label: string;
	value: IncidentDrawerFilter;
}> = [
	{ countKey: "open", label: "Open", value: "open" },
	{ countKey: "new", label: "New", value: "new" },
	{ countKey: "muted", label: "Muted", value: "muted" },
	{ countKey: "all", label: "All", value: "all" },
];

const emptyMessages: Record<IncidentDrawerFilter, string> = {
	all: "No incidents recorded",
	muted: "No acknowledged or snoozed incidents",
	new: "No unread incidents",
	open: "No open incidents",
};

export function IncidentDrawer({
	incidentState,
	badgeCount,
	expandedServerId,
	filterCounts,
	groups,
	incidentsCount,
	isClosing,
	now,
	onAcknowledgeIncident,
	onClearIncidentState,
	onClose,
	onFilterChange,
	onMarkAllRead,
	onSnoozeIncident,
	onToggleGroup,
	readIncidentIds,
	selectedFilter,
}: {
	incidentState: IncidentDrawerState;
	badgeCount: number;
	expandedServerId: string | null;
	filterCounts: IncidentFilterCounts;
	groups: IncidentGroup[];
	incidentsCount: number;
	isClosing: boolean;
	now: number;
	onAcknowledgeIncident: (incidentId: string) => void;
	onClearIncidentState: (incidentId: string) => void;
	onClose: () => void;
	onFilterChange: (filter: IncidentDrawerFilter) => void;
	onMarkAllRead: () => void;
	onSnoozeIncident: (incidentId: string, preset: SnoozePreset) => void;
	onToggleGroup: (group: IncidentGroup) => void;
	readIncidentIds: Set<string>;
	selectedFilter: IncidentDrawerFilter;
}) {
	return (
		<div className="fixed inset-0 z-50">
			<button
				type="button"
				className={`incident-backdrop absolute inset-0 cursor-default bg-slate-900/30 ${
					isClosing ? "is-closing" : ""
				}`}
				onClick={onClose}
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
									{incidentsCount} recorded events
								</p>
							</div>
						</div>
					</div>
					<div className="flex shrink-0 items-center gap-2">
						{badgeCount > 0 && (
							<Button
								onClick={onMarkAllRead}
								size="sm"
							>
								Mark all read
							</Button>
						)}
						<IconButton
							onClick={onClose}
							aria-label="Close"
							icon={X}
						/>
					</div>
				</div>

				<div className="flex flex-wrap gap-2 border-b border-slate-200 bg-white px-4.5 py-3">
					{filterOptions.map((option) => {
						const isSelected = selectedFilter === option.value;

						return (
							<button
								key={option.value}
								type="button"
								className={`inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-xs font-extrabold ${
									isSelected
										? "border-slate-900 bg-slate-900 text-white"
										: "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
								}`}
								onClick={() => onFilterChange(option.value)}
							>
								{option.label}
								<span
									className={`rounded-full px-1.5 py-0.5 text-[10px] ${
										isSelected
											? "bg-white/15 text-white"
											: "bg-slate-100 text-slate-500"
									}`}
								>
									{filterCounts[option.countKey]}
								</span>
							</button>
						);
					})}
				</div>

				<div className="min-h-0 flex-1 overflow-y-auto">
					{groups.length === 0 ? (
						<div className="flex min-h-44 flex-col items-center justify-center gap-2 px-6 text-center text-sm font-semibold text-slate-500">
							<Clock size={20} />
							{emptyMessages[selectedFilter]}
						</div>
					) : (
						<div className="divide-y divide-slate-200">
							{groups.map((group) => {
								const isExpanded = expandedServerId === group.serverId;

								return (
									<section key={group.serverId}>
										<button
											type="button"
											className="sticky top-0 z-10 flex w-full cursor-pointer items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4.5 py-2.5 text-left hover:bg-blue-50"
											onClick={() => onToggleGroup(group)}
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
														Latest {relativeTime(group.latestAt, now)}
													</span>
												</div>
											</div>
											<div className="flex shrink-0 items-center gap-2">
												{group.unreadCount > 0 && (
													<span
														className={`inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-extrabold ${
															group.unreadActiveCount > 0
																? "bg-red-100 text-red-700"
																: "bg-blue-50 text-blue-700"
														}`}
													>
														{group.unreadCount} new
													</span>
												)}
												<span className="inline-flex min-h-6 items-center rounded-full bg-white px-2.5 text-xs font-extrabold text-slate-600">
													{group.incidents.length}
												</span>
												{isExpanded ? (
													<ChevronUp size={16} className="text-slate-500" />
												) : (
													<ChevronDown size={16} className="text-slate-500" />
												)}
											</div>
										</button>
										{isExpanded && (
											<ol className="divide-y divide-slate-100">
												{group.incidents.map((incident) => {
													const snoozedUntil =
														getIncidentSnoozedUntil(
															incident,
															incidentState,
															now,
														);

													return (
														<IncidentListItem
															key={incident.id}
															incident={incident}
															isAcknowledged={isIncidentAcknowledged(
																incident,
																incidentState,
															)}
															isUnread={
																!readIncidentIds.has(
																	incident.id,
																)
															}
															now={now}
															onAcknowledge={() =>
																onAcknowledgeIncident(
																	incident.id,
																)
															}
															onClearAction={() =>
																onClearIncidentState(
																	incident.id,
																)
															}
															onSnooze={(preset) =>
																onSnoozeIncident(
																	incident.id,
																	preset,
																)
															}
															snoozedUntil={snoozedUntil}
														/>
													);
												})}
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
	);
}
