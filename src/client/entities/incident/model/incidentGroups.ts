import type { IncidentEvent } from "@shared/types";

export interface IncidentGroup {
	incidents: IncidentEvent[];
	latestAt: string;
	serverId: string;
	serverName: string;
	unreadActiveCount: number;
	unreadCount: number;
}

export interface UnreadIncidentStats {
	activeCount: number;
	count: number;
}

export const isActiveIncident = (incident: IncidentEvent) => {
	return incident.severity === "critical" || incident.severity === "warning";
};

export const sortIncidents = (incidents: IncidentEvent[]) => {
	return [...incidents].sort(
		(left, right) =>
			new Date(right.occurredAt).getTime() -
			new Date(left.occurredAt).getTime(),
	);
};

export const visibleBadgeCount = (count: number) => {
	return count > 99 ? "99+" : String(count);
};

export const getIncidentIds = (incidents: IncidentEvent[]) => {
	return incidents.map((incident) => incident.id);
};

export const getUnreadIncidentStats = (
	incidents: IncidentEvent[],
	readIncidentIds: Set<string>,
	isUnreadIncident = (incident: IncidentEvent) =>
		!readIncidentIds.has(incident.id),
): UnreadIncidentStats => {
	const unreadIncidents = incidents.filter(isUnreadIncident);

	return {
		activeCount: unreadIncidents.filter(isActiveIncident).length,
		count: unreadIncidents.length,
	};
};

export const groupIncidentsByServer = (
	incidents: IncidentEvent[],
	readIncidentIds: Set<string>,
	isUnreadIncident = (incident: IncidentEvent) =>
		!readIncidentIds.has(incident.id),
) => {
	const groups = new Map<string, IncidentGroup>();

	for (const incident of sortIncidents(incidents)) {
		const current = groups.get(incident.serverId);

		if (current) {
			current.incidents.push(incident);
			continue;
		}

		groups.set(incident.serverId, {
			incidents: [incident],
			latestAt: incident.occurredAt,
			serverId: incident.serverId,
			serverName: incident.serverName,
			unreadActiveCount: 0,
			unreadCount: 0,
		});
	}

	const incidentGroups = Array.from(groups.values());

	for (const group of incidentGroups) {
		const unreadIncidents = group.incidents.filter(isUnreadIncident);

		group.unreadCount = unreadIncidents.length;
		group.unreadActiveCount = unreadIncidents.filter(isActiveIncident).length;
	}

	return incidentGroups.sort(
		(left, right) =>
			new Date(right.latestAt).getTime() - new Date(left.latestAt).getTime(),
	);
};
