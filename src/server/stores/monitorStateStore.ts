import type {
	IncidentEvent,
	ServerMetricPoint,
	StoredServer,
} from "../../shared/types";
import {
	ConfigDocumentStore,
	readLegacyConfigDocument,
} from "./database/configDocumentStore";

interface MonitorState {
	servers: Record<string, StoredServer>;
}

const configKey = "monitor_state";

type LegacyStoredServer = Omit<
	StoredServer,
	"collectorVersion" | "incidents" | "metricsHistory"
> & {
	agentVersion?: string;
	collectorVersion?: string;
	incidents?: IncidentEvent[];
	metricsHistory?: ServerMetricPoint[];
};

const emptyState = (): MonitorState => ({ servers: {} });

const normalizeStoredServer = (server: LegacyStoredServer): StoredServer => {
	const { agentVersion, collectorVersion, ...serverWithoutLegacyVersion } =
		server;

	return {
		...serverWithoutLegacyVersion,
		collectorVersion: collectorVersion || agentVersion || "unknown",
		incidents: Array.isArray(server.incidents) ? server.incidents : [],
		metricsHistory: Array.isArray(server.metricsHistory)
			? server.metricsHistory
			: [],
	};
};

const normalizeState = (state: unknown): MonitorState => {
	if (!state || typeof state !== "object" || !("servers" in state)) {
		return emptyState();
	}

	const parsed = state as MonitorState;
	if (
		!parsed.servers ||
		typeof parsed.servers !== "object" ||
		Array.isArray(parsed.servers)
	) {
		return emptyState();
	}

	return {
		servers: Object.fromEntries(
			Object.entries(parsed.servers).map(([serverId, server]) => [
				serverId,
				normalizeStoredServer(server as LegacyStoredServer),
			]),
		),
	};
};

export class MonitorStateStore {
	private state: MonitorState;

	constructor(
		private readonly documents: ConfigDocumentStore,
		private readonly legacyFilePath: string,
	) {
		this.state = this.load();
	}

	getServer(serverId: string) {
		return this.state.servers[serverId];
	}

	listServers() {
		return Object.values(this.state.servers);
	}

	upsertServer(server: StoredServer) {
		this.state.servers[server.serverId] = server;
		this.save();

		return server;
	}

	private load(): MonitorState {
		const persisted = this.documents.get<MonitorState>(configKey);
		if (persisted) return normalizeState(persisted);

		const legacy = readLegacyConfigDocument(
			this.legacyFilePath,
			"monitor state",
		);
		const state = normalizeState(legacy.value);

		if (legacy.found) this.documents.set(configKey, state);

		return state;
	}

	private save() {
		this.documents.set(configKey, this.state);
	}
}
