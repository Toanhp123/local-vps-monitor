import type { ScanResult, ServerSnapshotPayload } from "../../shared/types";
import { localDockerServerId } from "../domain/serverIds";
import { collectLocalDockerApps } from "../integrations/local/localDockerAppsCollector";
import { collectLocalHostMetrics } from "../integrations/local/localHostMetricsCollector";
import type { MonitorOverviewService } from "./monitorOverviewService";

export class LocalDockerScanService {
	constructor(
		private readonly monitorOverviewService: MonitorOverviewService,
		private readonly commandTimeoutMs: number,
		private readonly version: string,
	) {}

	async scanLocalDocker(): Promise<ScanResult> {
		const [host, apps] = await Promise.all([
			Promise.resolve(collectLocalHostMetrics()),
			collectLocalDockerApps(this.commandTimeoutMs),
		]);
		const payload: ServerSnapshotPayload = {
			serverId: localDockerServerId,
			serverName: "Local Docker",
			collectorVersion: `local-docker/${this.version}`,
			observedAt: new Date().toISOString(),
			host,
			apps,
		};
		const server = this.monitorOverviewService.ingestSnapshot(payload);

		return {
			targetId: localDockerServerId,
			serverId: server.serverId,
			serverName: server.serverName,
			appCount: server.apps.length,
			scannedAt: server.lastSeenAt,
		};
	}
}
