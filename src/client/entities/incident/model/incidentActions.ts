import type { IncidentEvent } from "../../../../shared/types";
import { isActiveIncident } from "./incidentGroups";

export type IncidentDrawerFilter = "open" | "new" | "muted" | "all";

export type SnoozePreset = "30m" | "1h" | "today";

export interface IncidentActionState {
	acknowledgedIncidentIds: Set<string>;
	snoozedUntilByIncidentId: Map<string, number>;
}

export interface IncidentFilterCounts {
	all: number;
	muted: number;
	new: number;
	open: number;
}

export const snoozePresets: Array<{
	label: string;
	value: SnoozePreset;
}> = [
	{ label: "30m", value: "30m" },
	{ label: "1h", value: "1h" },
	{ label: "Today", value: "today" },
];

export const getSnoozeUntil = (preset: SnoozePreset, now: number) => {
	if (preset === "30m") return now + 30 * 60 * 1000;
	if (preset === "1h") return now + 60 * 60 * 1000;

	const endOfDay = new Date(now);
	endOfDay.setHours(23, 59, 59, 999);
	return endOfDay.getTime();
};

export const isIncidentAcknowledged = (
	incident: IncidentEvent,
	actionState: IncidentActionState,
) => {
	return actionState.acknowledgedIncidentIds.has(incident.id);
};

export const getIncidentSnoozedUntil = (
	incident: IncidentEvent,
	actionState: IncidentActionState,
	now: number,
) => {
	const snoozedUntil = actionState.snoozedUntilByIncidentId.get(incident.id);

	return snoozedUntil && snoozedUntil > now ? snoozedUntil : undefined;
};

export const isIncidentMuted = (
	incident: IncidentEvent,
	actionState: IncidentActionState,
	now: number,
) => {
	return (
		isIncidentAcknowledged(incident, actionState) ||
		getIncidentSnoozedUntil(incident, actionState, now) !== undefined
	);
};

export const isIncidentNew = (
	incident: IncidentEvent,
	readIncidentIds: Set<string>,
	actionState: IncidentActionState,
	now: number,
) => {
	return (
		!readIncidentIds.has(incident.id) &&
		!isIncidentMuted(incident, actionState, now)
	);
};

export const isIncidentOpen = (
	incident: IncidentEvent,
	actionState: IncidentActionState,
	now: number,
) => {
	return isActiveIncident(incident) && !isIncidentMuted(incident, actionState, now);
};

export const getIncidentFilterCounts = (
	incidents: IncidentEvent[],
	readIncidentIds: Set<string>,
	actionState: IncidentActionState,
	now: number,
): IncidentFilterCounts => {
	return incidents.reduce<IncidentFilterCounts>(
		(counts, incident) => {
			if (isIncidentOpen(incident, actionState, now)) counts.open += 1;
			if (isIncidentNew(incident, readIncidentIds, actionState, now)) {
				counts.new += 1;
			}
			if (isIncidentMuted(incident, actionState, now)) counts.muted += 1;

			return counts;
		},
		{
			all: incidents.length,
			muted: 0,
			new: 0,
			open: 0,
		},
	);
};

export const filterIncidents = (
	incidents: IncidentEvent[],
	filter: IncidentDrawerFilter,
	readIncidentIds: Set<string>,
	actionState: IncidentActionState,
	now: number,
) => {
	if (filter === "all") return incidents;

	return incidents.filter((incident) => {
		if (filter === "open") return isIncidentOpen(incident, actionState, now);
		if (filter === "new") {
			return isIncidentNew(incident, readIncidentIds, actionState, now);
		}

		return isIncidentMuted(incident, actionState, now);
	});
};
