import type {
	IncidentStateSnapshot,
	IncidentSnoozeState,
} from "../../shared/types";
import {
	ConfigDocumentStore,
	readLegacyConfigDocument,
} from "./database/configDocumentStore";

const configKey = "incident_state";
const maxStoredIncidentStateIds = 500;

const emptyState = (): IncidentStateSnapshot => ({
	acknowledgedIncidentIds: [],
	readIncidentIds: [],
	snoozedIncidents: [],
});

const normalizeIdList = (values: unknown) => {
	if (!Array.isArray(values)) return [];

	return Array.from(
		new Set(
			values.filter((value): value is string => typeof value === "string"),
		),
	).slice(-maxStoredIncidentStateIds);
};

const normalizeSnoozedIncidents = (values: unknown) => {
	if (!Array.isArray(values)) return [];

	const byId = new Map<string, IncidentSnoozeState>();

	for (const value of values) {
		if (
			!value ||
			typeof value !== "object" ||
			!("incidentId" in value) ||
			!("snoozedUntil" in value)
		) {
			continue;
		}

		const incidentId = value.incidentId;
		const snoozedUntil = value.snoozedUntil;

		if (
			typeof incidentId !== "string" ||
			typeof snoozedUntil !== "number" ||
			!Number.isFinite(snoozedUntil)
		) {
			continue;
		}

		byId.set(incidentId, { incidentId, snoozedUntil });
	}

	return Array.from(byId.values()).slice(-maxStoredIncidentStateIds);
};

const normalizeState = (state: unknown): IncidentStateSnapshot => {
	if (!state || typeof state !== "object") return emptyState();

	return {
		acknowledgedIncidentIds: normalizeIdList(
			(state as IncidentStateSnapshot).acknowledgedIncidentIds,
		),
		readIncidentIds: normalizeIdList(
			(state as IncidentStateSnapshot).readIncidentIds,
		),
		snoozedIncidents: normalizeSnoozedIncidents(
			(state as IncidentStateSnapshot).snoozedIncidents,
		),
	};
};

export class IncidentStateStore {
	private state: IncidentStateSnapshot;

	constructor(
		private readonly documents: ConfigDocumentStore,
		private readonly legacyFilePath: string,
	) {
		this.state = this.load();
	}

	get() {
		return this.state;
	}

	replace(input: IncidentStateSnapshot) {
		this.state = normalizeState(input);
		this.save();

		return this.state;
	}

	private load(): IncidentStateSnapshot {
		const persisted =
			this.documents.get<IncidentStateSnapshot>(configKey);
		if (persisted) return normalizeState(persisted);

		const legacy = readLegacyConfigDocument(
			this.legacyFilePath,
			"incident state",
		);
		const state = normalizeState(legacy.value);

		if (legacy.found) this.documents.set(configKey, state);

		return state;
	}

	private save() {
		this.documents.set(configKey, this.state);
	}
}
