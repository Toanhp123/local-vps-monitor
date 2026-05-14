import type { HeartbeatPayload, OverviewResponse } from "../../shared/types";
import type { MonitorStateStore } from "../models/monitorStateStore";

type OverviewListener = (overview: OverviewResponse) => void;

export class MonitorOverviewService {
  private readonly overviewListeners = new Set<OverviewListener>();

  constructor(private readonly monitorStateStore: MonitorStateStore) {}

  ingestHeartbeat(payload: HeartbeatPayload) {
    const server = this.monitorStateStore.ingest(payload);
    this.notifyOverviewUpdated();

    return server;
  }

  getOverview() {
    return this.monitorStateStore.overview();
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
