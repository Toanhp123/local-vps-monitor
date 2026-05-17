import type { IncidentEvent } from "@shared/types";
import { isActiveIncident } from "./incidentGroups";

export type IncidentDrawerFilter = "open" | "new" | "muted" | "all";

export type SnoozePreset = "30m" | "1h" | "today";

export interface IncidentDrawerState {
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
	incidentState: IncidentDrawerState,
) => {
	return incidentState.acknowledgedIncidentIds.has(incident.id);
};

export const getIncidentSnoozedUntil = (
	incident: IncidentEvent,
	incidentState: IncidentDrawerState,
	now: number,
) => {
	const snoozedUntil = incidentState.snoozedUntilByIncidentId.get(incident.id);

	return snoozedUntil && snoozedUntil > now ? snoozedUntil : undefined;
};

export const isIncidentMuted = (
	incident: IncidentEvent,
	incidentState: IncidentDrawerState,
	now: number,
) => {
	return (
		isIncidentAcknowledged(incident, incidentState) ||
		getIncidentSnoozedUntil(incident, incidentState, now) !== undefined
	);
};

export const isIncidentNew = (
	incident: IncidentEvent,
	readIncidentIds: Set<string>,
	incidentState: IncidentDrawerState,
	now: number,
) => {
	return (
		!readIncidentIds.has(incident.id) &&
		!isIncidentMuted(incident, incidentState, now)
	);
};

export const isIncidentOpen = (
	incident: IncidentEvent,
	incidentState: IncidentDrawerState,
	now: number,
) => {
	return isActiveIncident(incident) && !isIncidentMuted(incident, incidentState, now);
};

export const getIncidentFilterCounts = (
	incidents: IncidentEvent[],
	readIncidentIds: Set<string>,
	incidentState: IncidentDrawerState,
	now: number,
): IncidentFilterCounts => {
	return incidents.reduce<IncidentFilterCounts>(
		(counts, incident) => {
			if (isIncidentOpen(incident, incidentState, now)) counts.open += 1;
			if (isIncidentNew(incident, readIncidentIds, incidentState, now)) {
				counts.new += 1;
			}
			if (isIncidentMuted(incident, incidentState, now)) counts.muted += 1;

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
	incidentState: IncidentDrawerState,
	now: number,
) => {
	if (filter === "all") return incidents;

	return incidents.filter((incident) => {
		if (filter === "open") return isIncidentOpen(incident, incidentState, now);
		if (filter === "new") {
			return isIncidentNew(incident, readIncidentIds, incidentState, now);
		}

		return isIncidentMuted(incident, incidentState, now);
	});
};
