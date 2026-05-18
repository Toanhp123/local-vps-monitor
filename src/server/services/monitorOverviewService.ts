import type {
	ServerAlertPolicy,
	AppPolicy,
	IncidentEvent,
	OverviewResponse,
	ServerMetricPoint,
	ServerSnapshotPayload,
	StoredServer,
} from "../../shared/types";
import { defaultServerAlertPolicy } from "../domain/monitoring/policies/serverResourcePolicy";
import { appendIncidentTimeline } from "../domain/monitoring/incidents/incidentTimeline";
import {
	buildOverview,
	createStoredServerFromSnapshot,
} from "../domain/monitoring/overviewProjection";
import type { MonitorStateStore } from "../stores/monitorStateStore";

type OverviewListener = (overview: OverviewResponse) => void;

export interface MonitorOverviewPersistence {
	recordIncident: (incident: IncidentEvent) => void;
	recordServerMetric: (
		server: StoredServer,
		payload: ServerSnapshotPayload,
		metric: ServerMetricPoint,
	) => void;
}

export class MonitorOverviewService {
	private readonly overviewListeners = new Set<OverviewListener>();

	constructor(
		private readonly monitorStateStore: MonitorStateStore,
		private readonly offlineAfterMs: (serverId: string) => number,
		private readonly appPolicies: () => AppPolicy[] = () => [],
		private readonly serverAlertPolicy: () => ServerAlertPolicy = () =>
			defaultServerAlertPolicy,
		private readonly metricHistoryLimit: () => number = () => 60,
		private readonly incidentHistoryLimit: () => number = () => 100,
		private readonly persistence?: MonitorOverviewPersistence,
	) {}

	ingestSnapshot(payload: ServerSnapshotPayload) {
		const previousServer = this.monitorStateStore.getServer(
			payload.serverId,
		);
		const server = createStoredServerFromSnapshot(
			payload,
			previousServer,
			new Date(),
			this.appPolicies(),
			this.serverAlertPolicy(),
			{
				incidentHistoryLimit: this.incidentHistoryLimit(),
				metricHistoryLimit: this.metricHistoryLimit(),
			},
		);

		this.monitorStateStore.upsertServer(server);
		this.recordSnapshotPersistence(server, payload, previousServer);
		this.notifyOverviewUpdated();

		return server;
	}

	getOverview() {
		return buildOverview(
			this.monitorStateStore.listServers(),
			(serverId) => this.offlineAfterMs(serverId),
			new Date(),
			this.appPolicies(),
			this.serverAlertPolicy(),
		);
	}

	getServer(serverId: string) {
		return this.getOverview().servers.find(
			(server) => server.serverId === serverId,
		);
	}

	appendServerIncident(serverId: string, incident: IncidentEvent) {
		const server = this.monitorStateStore.getServer(serverId);
		if (!server) return null;

		const updatedServer = {
			...server,
			incidents: appendIncidentTimeline(
				server.incidents,
				[incident],
				this.incidentHistoryLimit(),
			),
		};

		this.monitorStateStore.upsertServer(updatedServer);
		this.recordIncident(incident);
		this.notifyOverviewUpdated();

		return updatedServer;
	}

	applyRetentionLimits() {
		const metricHistoryLimit = Math.max(
			1,
			Math.round(this.metricHistoryLimit()),
		);
		const incidentHistoryLimit = Math.max(
			1,
			Math.round(this.incidentHistoryLimit()),
		);
		let changed = false;

		for (const server of this.monitorStateStore.listServers()) {
			const metricsHistory = server.metricsHistory.slice(-metricHistoryLimit);
			const incidents = server.incidents.slice(0, incidentHistoryLimit);
			if (
				metricsHistory.length === server.metricsHistory.length &&
				incidents.length === server.incidents.length
			) {
				continue;
			}

			this.monitorStateStore.upsertServer({
				...server,
				incidents,
				metricsHistory,
			});
			changed = true;
		}

		if (changed) this.notifyOverviewUpdated();

		return changed;
	}

	onOverviewUpdated(listener: OverviewListener) {
		this.overviewListeners.add(listener);

		return () => {
			this.overviewListeners.delete(listener);
		};
	}

	refreshOverview() {
		this.notifyOverviewUpdated();
	}

	private notifyOverviewUpdated() {
		const overview = this.getOverview();

		for (const listener of this.overviewListeners) {
			listener(overview);
		}
	}

	private recordSnapshotPersistence(
		server: StoredServer,
		payload: ServerSnapshotPayload,
		previousServer: StoredServer | undefined,
	) {
		if (!this.persistence) return;

		const metric = server.metricsHistory.at(-1);
		if (metric) {
			try {
				this.persistence.recordServerMetric(server, payload, metric);
			} catch (error) {
				console.error("Failed to persist server metric:", error);
			}
		}

		const previousIncidentIds = new Set(
			previousServer?.incidents.map((incident) => incident.id) ?? [],
		);
		for (const incident of server.incidents) {
			if (previousIncidentIds.has(incident.id)) continue;
			this.recordIncident(incident);
		}
	}

	private recordIncident(incident: IncidentEvent) {
		if (!this.persistence) return;

		try {
			this.persistence.recordIncident(incident);
		} catch (error) {
			console.error("Failed to persist incident:", error);
		}
	}
}
