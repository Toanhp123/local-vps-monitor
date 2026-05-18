import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import type { IncidentEvent } from "@shared/types";
import { routes } from "@/shared/config/routes";
import {
	filterIncidents,
	getIncidentFilterCounts,
	isIncidentNew,
	type IncidentDrawerFilter,
	type SnoozePreset,
} from "../model/incidentState";
import {
	getIncidentIds,
	getUnreadIncidentStats,
	groupIncidentsByServer,
	type IncidentGroup,
	visibleBadgeCount,
} from "../model/incidentGroups";
import { useIncidentDrawerState } from "../model/useIncidentDrawerState";
import { IncidentDrawer } from "./IncidentDrawer";

const drawerAnimationMs = 280;

export function IncidentNotificationCenter({
	incidents,
	now,
}: {
	incidents: IncidentEvent[];
	now: number;
}) {
	const navigate = useNavigate();
	const [isOpen, setIsOpen] = useState(false);
	const [isClosing, setIsClosing] = useState(false);
	const [expandedServerId, setExpandedServerId] = useState<string | null>(
		null,
	);
	const [drawerFilter, setDrawerFilter] =
		useState<IncidentDrawerFilter>("all");
	const closeTimerRef = useRef<number | null>(null);
	const {
		acknowledgeIncident,
		incidentState,
		clearIncidentState,
		markAllRead,
		markIncidentsRead,
		markIncidentsUnread,
		readIncidentIds,
		snoozeIncident,
	} = useIncidentDrawerState(incidents, now);
	const isUnreadIncident = useCallback(
		(incident: IncidentEvent) =>
			isIncidentNew(incident, readIncidentIds, incidentState, now),
		[incidentState, now, readIncidentIds],
	);
	const visibleIncidents = useMemo(
		() =>
			filterIncidents(
				incidents,
				drawerFilter,
				readIncidentIds,
				incidentState,
				now,
			),
		[incidentState, drawerFilter, incidents, now, readIncidentIds],
	);
	const incidentGroups = useMemo(
		() =>
			groupIncidentsByServer(
				visibleIncidents,
				readIncidentIds,
				isUnreadIncident,
			),
		[isUnreadIncident, readIncidentIds, visibleIncidents],
	);
	const unreadStats = useMemo(
		() =>
			getUnreadIncidentStats(incidents, readIncidentIds, isUnreadIncident),
		[incidents, isUnreadIncident, readIncidentIds],
	);
	const filterCounts = useMemo(
		() =>
			getIncidentFilterCounts(incidents, readIncidentIds, incidentState, now),
		[incidentState, incidents, now, readIncidentIds],
	);

	const openGroup = useCallback(
		(group: IncidentGroup | undefined) => {
			if (!group) return;

			setExpandedServerId(group.serverId);
			markIncidentsRead(getIncidentIds(group.incidents));
		},
		[markIncidentsRead],
	);

	const openDrawer = useCallback(() => {
		if (closeTimerRef.current) {
			window.clearTimeout(closeTimerRef.current);
			closeTimerRef.current = null;
		}

		const groupToRead =
			incidentGroups.find(
				(group) => group.serverId === expandedServerId,
			) || incidentGroups[0];

		setIsClosing(false);
		setIsOpen(true);
		openGroup(groupToRead);
	}, [expandedServerId, incidentGroups, openGroup]);

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

	const handleToggleGroup = useCallback(
		(group: IncidentGroup) => {
			if (expandedServerId === group.serverId) {
				setExpandedServerId(null);
				return;
			}

			openGroup(group);
		},
		[expandedServerId, openGroup],
	);

	const handleAcknowledgeIncident = useCallback(
		(incidentId: string) => {
			markIncidentsRead([incidentId]);
			acknowledgeIncident(incidentId);
		},
		[acknowledgeIncident, markIncidentsRead],
	);

	const handleSnoozeIncident = useCallback(
		(incidentId: string, preset: SnoozePreset) => {
			markIncidentsRead([incidentId]);
			snoozeIncident(incidentId, preset);
		},
		[markIncidentsRead, snoozeIncident],
	);

	const handleViewAll = useCallback(() => {
		closeDrawer();
		navigate(routes.incidents);
	}, [closeDrawer, navigate]);

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
		const expiredSnoozedIncidentIds = incidents
			.filter((incident) => {
				const snoozedUntil =
					incidentState.snoozedUntilByIncidentId.get(incident.id);

				return snoozedUntil !== undefined && snoozedUntil <= now;
			})
			.map((incident) => incident.id);

		if (expiredSnoozedIncidentIds.length === 0) return;

		markIncidentsUnread(expiredSnoozedIncidentIds);

		for (const incidentId of expiredSnoozedIncidentIds) {
			clearIncidentState(incidentId);
		}
	}, [
		incidentState,
		clearIncidentState,
		incidents,
		markIncidentsUnread,
		now,
	]);

	useEffect(() => {
		if (!expandedServerId) return;

		if (
			!incidentGroups.some((group) => group.serverId === expandedServerId)
		) {
			setExpandedServerId(null);
		}
	}, [expandedServerId, incidentGroups]);

	return (
		<>
			<button
				type="button"
				className="relative inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
				onClick={openDrawer}
				aria-label="Open incident notifications"
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
				<IncidentDrawer
					incidentState={incidentState}
					badgeCount={unreadStats.count}
					expandedServerId={expandedServerId}
					filterCounts={filterCounts}
					groups={incidentGroups}
					incidentsCount={incidents.length}
					isClosing={isClosing}
					now={now}
					onAcknowledgeIncident={handleAcknowledgeIncident}
					onClearIncidentState={clearIncidentState}
					onClose={closeDrawer}
					onFilterChange={setDrawerFilter}
					onMarkAllRead={markAllRead}
					onSnoozeIncident={handleSnoozeIncident}
					onToggleGroup={handleToggleGroup}
					onViewAll={handleViewAll}
					readIncidentIds={readIncidentIds}
					selectedFilter={drawerFilter}
				/>
			)}
		</>
	);
}
