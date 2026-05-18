import type { IncidentEvent } from "@shared/types";

interface TimelineGroup {
	id: string;
	incidents: IncidentEvent[];
	label: string;
	startedAt: number;
}

const pad = (value: number) => value.toString().padStart(2, "0");

const timelineHourStart = (value: string) => {
	const date = new Date(value);
	date.setMinutes(0, 0, 0);
	return date.getTime();
};

const formatTimelineHourLabel = (timestamp: number) => {
	const date = new Date(timestamp);
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
		date.getDate(),
	)} ${pad(date.getHours())}:00`;
};

export const groupIncidentsByHour = (
	incidents: IncidentEvent[],
): TimelineGroup[] => {
	const groups = new Map<string, IncidentEvent[]>();

	for (const incident of incidents) {
		const startedAt = timelineHourStart(incident.occurredAt);
		const groupId = String(startedAt);

		if (!groups.has(groupId)) {
			groups.set(groupId, []);
		}
		groups.get(groupId)!.push(incident);
	}

	return Array.from(groups.entries())
		.map(([id, incidents]) => {
			const startedAt = Number(id);

			return {
				id,
				incidents: [...incidents].sort(
					(first, second) =>
						new Date(second.occurredAt).getTime() -
						new Date(first.occurredAt).getTime(),
				),
				label: formatTimelineHourLabel(startedAt),
				startedAt,
			};
		})
		.sort((first, second) => second.startedAt - first.startedAt);
};
