import type { IncidentEvent, IncidentKind, IncidentSeverity } from "@shared/types";

export interface IncidentFilters {
	textSearch: string;
	severities: Set<IncidentSeverity>;
	kinds: Set<IncidentKind>;
	serverIds: Set<string>;
	appNames: Set<string>;
	dateRange: "1h" | "today" | "7d" | "all";
	state: "unread" | "acknowledged" | "snoozed" | "all";
}

export const createEmptyFilters = (): IncidentFilters => ({
	textSearch: "",
	severities: new Set(),
	kinds: new Set(),
	serverIds: new Set(),
	appNames: new Set(),
	dateRange: "all",
	state: "all",
});

export const filterIncidents = (
	incidents: IncidentEvent[],
	filters: IncidentFilters,
	readIncidentIds: Set<string>,
	acknowledgedIds: Set<string>,
	snoozedIds: Set<string>,
	now: number,
): IncidentEvent[] => {
	return incidents.filter((incident) => {
		// Text search
		if (filters.textSearch) {
			const search = filters.textSearch.toLowerCase();
			const matchesText =
				incident.message.toLowerCase().includes(search) ||
				incident.serverName.toLowerCase().includes(search) ||
				(incident.appName?.toLowerCase().includes(search) ?? false);
			if (!matchesText) return false;
		}

		// Severity
		if (filters.severities.size > 0 && !filters.severities.has(incident.severity)) {
			return false;
		}

		// Kind
		if (filters.kinds.size > 0 && !filters.kinds.has(incident.kind)) {
			return false;
		}

		// Server
		if (filters.serverIds.size > 0 && !filters.serverIds.has(incident.serverId)) {
			return false;
		}

		// App
		if (filters.appNames.size > 0) {
			if (!incident.appName || !filters.appNames.has(incident.appName)) {
				return false;
			}
		}

		// Date range
		if (filters.dateRange !== "all") {
			const occurredAt = new Date(incident.occurredAt).getTime();
			const cutoff =
				filters.dateRange === "1h"
					? now - 60 * 60 * 1000
					: filters.dateRange === "today"
						? new Date(now).setHours(0, 0, 0, 0)
						: now - 7 * 24 * 60 * 60 * 1000;
			if (occurredAt < cutoff) return false;
		}

		// State
		if (filters.state !== "all") {
			const isUnread = !readIncidentIds.has(incident.id);
			const isAcknowledged = acknowledgedIds.has(incident.id);
			const isSnoozed = snoozedIds.has(incident.id);

			if (filters.state === "unread" && !isUnread) return false;
			if (filters.state === "acknowledged" && !isAcknowledged) return false;
			if (filters.state === "snoozed" && !isSnoozed) return false;
		}

		return true;
	});
};

export const sortIncidents = (
	incidents: IncidentEvent[],
	sortBy: "time" | "severity" | "server",
	sortOrder: "asc" | "desc",
): IncidentEvent[] => {
	return [...incidents].sort((a, b) => {
		let comparison = 0;

		if (sortBy === "time") {
			comparison =
				new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
		} else if (sortBy === "severity") {
			const severityRank = { critical: 3, warning: 2, info: 1, resolved: 0 };
			comparison = severityRank[b.severity] - severityRank[a.severity];
		} else {
			comparison = a.serverName.localeCompare(b.serverName);
		}

		return sortOrder === "asc" ? comparison : -comparison;
	});
};
