import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell } from "lucide-react";
import type { IncidentEvent } from "../../../../shared/types";
import {
	getIncidentIds,
	getUnreadIncidentStats,
	groupIncidentsByServer,
	type IncidentGroup,
	visibleBadgeCount,
} from "../model/incidentGroups";
import { useIncidentReadState } from "../model/useIncidentReadState";
import { IncidentDrawer } from "./IncidentDrawer";

const drawerAnimationMs = 280;

export function IncidentNotificationCenter({
	incidents,
	now,
}: {
	incidents: IncidentEvent[];
	now: number;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [isClosing, setIsClosing] = useState(false);
	const [expandedServerId, setExpandedServerId] = useState<string | null>(
		null,
	);
	const closeTimerRef = useRef<number | null>(null);
	const { markAllRead, markIncidentsRead, readIncidentIds } =
		useIncidentReadState(incidents);
	const incidentGroups = useMemo(
		() => groupIncidentsByServer(incidents, readIncidentIds),
		[incidents, readIncidentIds],
	);
	const unreadStats = useMemo(
		() => getUnreadIncidentStats(incidents, readIncidentIds),
		[incidents, readIncidentIds],
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
					badgeCount={unreadStats.count}
					expandedServerId={expandedServerId}
					groups={incidentGroups}
					incidentsCount={incidents.length}
					isClosing={isClosing}
					now={now}
					onClose={closeDrawer}
					onMarkAllRead={markAllRead}
					onToggleGroup={handleToggleGroup}
					readIncidentIds={readIncidentIds}
				/>
			)}
		</>
	);
}
