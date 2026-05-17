import type {
	AppSnapshot,
	IncidentEvent,
	ServerAlertThresholds,
	ServerSnapshotPayload,
	StoredServer,
} from "../../../../shared/types";
import { createAppIncidentEvents } from "./appIncidentRules";
import { createServerResourceIncidents } from "./serverResourceIncidentRules";

const maxIncidentEvents = 100;
const minIncidentEvents = 1;

const normalizeIncidentLimit = (value: number) => {
	if (!Number.isFinite(value)) return maxIncidentEvents;

	return Math.max(minIncidentEvents, Math.round(value));
};

export const createIncidentEvents = (
	apps: AppSnapshot[],
	payload: ServerSnapshotPayload,
	previousServer: StoredServer | undefined,
	observedAt: Date,
	thresholds?: ServerAlertThresholds,
) => {
	const incidents = createAppIncidentEvents({
		apps,
		observedAt,
		payload,
		previousApps: previousServer?.apps ?? [],
		previousServerExists: previousServer !== undefined,
	});
	incidents.push(...createServerResourceIncidents(
		payload,
		observedAt,
		previousServer,
		thresholds,
	));

	return incidents;
};

export const appendIncidentTimeline = (
	previousIncidents: IncidentEvent[] | undefined,
	incidents: IncidentEvent[],
	limit = maxIncidentEvents,
) => {
	return [...incidents, ...(previousIncidents ?? [])].slice(
		0,
		normalizeIncidentLimit(limit),
	);
};
