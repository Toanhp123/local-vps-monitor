import type {
	AppSnapshot,
	IncidentEvent,
	ServerSnapshotPayload,
	StoredServer,
} from "../../../../shared/types";
import { createAppIncidentEvents } from "./appIncidentRules";
import { createDiskUsageIncident } from "./diskIncidentRules";

const maxIncidentEvents = 100;

export const createIncidentEvents = (
	apps: AppSnapshot[],
	payload: ServerSnapshotPayload,
	previousServer: StoredServer | undefined,
	observedAt: Date,
) => {
	const incidents = createAppIncidentEvents({
		apps,
		observedAt,
		payload,
		previousApps: previousServer?.apps ?? [],
		previousServerExists: previousServer !== undefined,
	});
	const diskIncident = createDiskUsageIncident(
		payload,
		observedAt,
		previousServer,
	);

	if (diskIncident) incidents.push(diskIncident);

	return incidents;
};

export const appendIncidentTimeline = (
	previousIncidents: IncidentEvent[] | undefined,
	incidents: IncidentEvent[],
) => {
	return [...incidents, ...(previousIncidents ?? [])].slice(
		0,
		maxIncidentEvents,
	);
};
