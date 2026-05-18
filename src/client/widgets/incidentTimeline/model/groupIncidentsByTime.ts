import type { IncidentEvent } from "@shared/types";

interface TimelineGroup {
	hour: string;
	incidents: IncidentEvent[];
}

export const groupIncidentsByHour = (
	incidents: IncidentEvent[],
): TimelineGroup[] => {
	const groups = new Map<string, IncidentEvent[]>();

	for (const incident of incidents) {
		const date = new Date(incident.occurredAt);
		const hour = `${date.getHours().toString().padStart(2, "0")}:00`;

		if (!groups.has(hour)) {
			groups.set(hour, []);
		}
		groups.get(hour)!.push(incident);
	}

	return Array.from(groups.entries())
		.map(([hour, incidents]) => ({ hour, incidents }))
		.sort((a, b) => a.hour.localeCompare(b.hour));
};
