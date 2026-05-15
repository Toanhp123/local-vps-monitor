import type {
	OverviewResponse,
	ServerSnapshotPayload,
} from "../../shared/types";
import {
	buildOverview,
	createStoredServerFromSnapshot,
} from "../domain/monitoring/overviewProjection";
import type { MonitorStateStore } from "../stores/monitorStateStore";

type OverviewListener = (overview: OverviewResponse) => void;

export class MonitorOverviewService {
	private readonly overviewListeners = new Set<OverviewListener>();

	constructor(
		private readonly monitorStateStore: MonitorStateStore,
		private readonly offlineAfterMs: number,
	) {}

	ingestSnapshot(payload: ServerSnapshotPayload) {
		const previousServer = this.monitorStateStore.getServer(
			payload.serverId,
		);
		const server = createStoredServerFromSnapshot(
			payload,
			previousServer,
			new Date(),
		);

		this.monitorStateStore.upsertServer(server);
		this.notifyOverviewUpdated();

		return server;
	}

	getOverview() {
		return buildOverview(
			this.monitorStateStore.listServers(),
			this.offlineAfterMs,
		);
	}

	getServer(serverId: string) {
		return this.getOverview().servers.find(
			(server) => server.serverId === serverId,
		);
	}

	onOverviewUpdated(listener: OverviewListener) {
		this.overviewListeners.add(listener);

		return () => {
			this.overviewListeners.delete(listener);
		};
	}

	private notifyOverviewUpdated() {
		const overview = this.getOverview();

		for (const listener of this.overviewListeners) {
			listener(overview);
		}
	}
}
