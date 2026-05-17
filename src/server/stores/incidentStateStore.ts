import fs from "node:fs";
import path from "node:path";
import type {
	IncidentStateSnapshot,
	IncidentSnoozeState,
} from "../../shared/types";

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

	constructor(private readonly filePath: string) {
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
		if (!fs.existsSync(this.filePath)) return emptyState();

		try {
			const raw = fs.readFileSync(this.filePath, "utf8");
			return normalizeState(JSON.parse(raw));
		} catch (error) {
			console.warn(
				`Cannot read incident state at ${this.filePath}:`,
				error,
			);
			return emptyState();
		}
	}

	private save() {
		fs.mkdirSync(path.dirname(this.filePath), { recursive: true });

		const tempPath = `${this.filePath}.tmp`;
		fs.writeFileSync(tempPath, JSON.stringify(this.state, null, 2), {
			mode: 0o600,
		});
		fs.renameSync(tempPath, this.filePath);

		if (process.platform !== "win32") {
			fs.chmodSync(this.filePath, 0o600);
		}
	}
}
