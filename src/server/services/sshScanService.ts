import type { HeartbeatPayload, SshScanAllResponse, SshScanResult, SshTarget } from "../../shared/types";
import { connectSshTarget } from "../integrations/ssh/sshCommandRunner";
import { collectSshDockerApps } from "../integrations/ssh/sshDockerAppsCollector";
import { collectSshHostMetrics } from "../integrations/ssh/sshHostMetricsCollector";
import { collectSshPm2Apps } from "../integrations/ssh/sshPm2AppsCollector";
import { errorMessage } from "../lib/errorMessage";
import type { SshTargetConfigStore } from "../models/sshTargetConfigStore";
import type { MonitorOverviewService } from "./monitorOverviewService";

export class SshTargetNotFoundError extends Error {
  constructor(targetId: string) {
    super(`SSH target not found: ${targetId}`);
    this.name = "SshTargetNotFoundError";
  }
}

export class SshScanService {
  constructor(
    private readonly targetConfigStore: SshTargetConfigStore,
    private readonly monitorOverviewService: MonitorOverviewService,
    private readonly commandTimeoutMs: number,
    private readonly version: string
  ) {}

  async scanTarget(targetId: string) {
    const target = this.targetConfigStore.get(targetId);
    if (!target) throw new SshTargetNotFoundError(targetId);

    return this.scanKnownTarget(target);
  }

  async scanAllTargets(): Promise<SshScanAllResponse> {
    const targets = this.targetConfigStore.list().filter((target) => target.enabled);
    const settled = await Promise.allSettled(targets.map((target) => this.scanKnownTarget(target)));

    return settled.reduce<SshScanAllResponse>(
      (response, result, index) => {
        if (result.status === "fulfilled") {
          response.results.push(result.value);
        } else {
          response.errors.push({
            targetId: targets[index]?.id || "unknown",
            message: errorMessage(result.reason)
          });
        }

        return response;
      },
      { results: [], errors: [] }
    );
  }

  private async scanKnownTarget(target: SshTarget): Promise<SshScanResult> {
    const client = await connectSshTarget(target, this.commandTimeoutMs);

    try {
      const [host, dockerApps, pm2Apps] = await Promise.all([
        collectSshHostMetrics(client, this.commandTimeoutMs),
        collectSshDockerApps(client, this.commandTimeoutMs),
        collectSshPm2Apps(client, this.commandTimeoutMs)
      ]);
      const payload: HeartbeatPayload = {
        serverId: target.id,
        serverName: target.name,
        agentVersion: `local-ssh/${this.version}`,
        observedAt: new Date().toISOString(),
        host,
        apps: [...dockerApps, ...pm2Apps]
      };
      const server = this.monitorOverviewService.ingestHeartbeat(payload);

      return {
        targetId: target.id,
        serverId: server.serverId,
        serverName: server.serverName,
        appCount: server.apps.length,
        scannedAt: server.lastSeenAt
      };
    } finally {
      client.end();
    }
  }
}
