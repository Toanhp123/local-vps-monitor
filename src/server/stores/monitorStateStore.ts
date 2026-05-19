import type { IncidentEvent, StoredServer } from "../../shared/types";
import { ConfigDocumentStore } from "./database/configDocumentStore";

interface MonitorState {
	servers: Record<string, StoredServer>;
}

const configKey = "monitor_state";

type LegacyStoredServer = Omit<
	StoredServer,
	"collectorVersion" | "incidents"
> & {
	agentVersion?: string;
	collectorVersion?: string;
	incidents?: IncidentEvent[];
};

const emptyState = (): MonitorState => ({ servers: {} });

const normalizeStoredServer = (server: LegacyStoredServer): StoredServer => {
	return {
		apps: server.apps,
		collectorVersion:
			server.collectorVersion || server.agentVersion || "unknown",
		host: server.host,
		incidents: Array.isArray(server.incidents) ? server.incidents : [],
		lastSeenAt: server.lastSeenAt,
		observedAt: server.observedAt,
		online: server.online,
		serverId: server.serverId,
		serverName: server.serverName,
		status: server.status,
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

	constructor(private readonly documents: ConfigDocumentStore) {
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

		const state = emptyState();
		this.documents.set(configKey, state);
		return state;
	}

	private save() {
		this.documents.set(configKey, this.state);
	}
}
