import type { HeartbeatPayload, OverviewResponse } from "../../shared/types";
import type { MonitorStore } from "../models/monitorStore";

type OverviewListener = (overview: OverviewResponse) => void;

export class MonitorService {
  private readonly overviewListeners = new Set<OverviewListener>();

  constructor(private readonly monitorStore: MonitorStore) {}

  ingestHeartbeat(payload: HeartbeatPayload) {
    const server = this.monitorStore.ingest(payload);
    this.notifyOverviewUpdated();

    return server;
  }

  getOverview() {
    return this.monitorStore.overview();
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
