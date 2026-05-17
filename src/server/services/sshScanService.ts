import type {
	ServerSnapshotPayload,
	SshScanAllResponse,
	SshScanResult,
	SshTarget,
} from "../../shared/types";
import {
	connectSshTarget,
	runSshCommand,
} from "../integrations/ssh/sshCommandRunner";
import { collectSshDockerApps } from "../integrations/ssh/sshDockerAppsCollector";
import { collectSshHostMetrics } from "../integrations/ssh/sshHostMetricsCollector";
import { collectSshPm2Apps } from "../integrations/ssh/sshPm2AppsCollector";
import { errorMessage } from "../lib/errorMessage";
import { settleWithConcurrency } from "../lib/settleWithConcurrency";
import type { SshTargetConfigStore } from "../stores/sshTargetConfigStore";
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
		private readonly commandTimeoutMs: () => number,
		private readonly scanConcurrency: () => number,
		private readonly version: string,
	) {}

	async scanTarget(targetId: string) {
		const target = this.targetConfigStore.get(targetId);
		if (!target) throw new SshTargetNotFoundError(targetId);

		return this.scanKnownTarget(target);
	}

	async testTarget(targetId: string) {
		const target = this.targetConfigStore.get(targetId);
		if (!target) throw new SshTargetNotFoundError(targetId);

		const checkedAt = new Date().toISOString();
		const commandTimeoutMs = this.commandTimeoutMs();
		const client = await connectSshTarget(target, commandTimeoutMs);

		try {
			const result = await runSshCommand(
				client,
				"echo ok",
				commandTimeoutMs,
			);
			const output = [result.stdout.trim(), result.stderr.trim()]
				.filter(Boolean)
				.join("\n");

			return {
				checkedAt,
				message: result.ok
					? "SSH key login succeeded."
					: output || "SSH test command failed.",
				ok: result.ok,
				targetId,
			};
		} finally {
			client.end();
		}
	}

	async scanAllTargets(): Promise<SshScanAllResponse> {
		const targets = this.targetConfigStore
			.list()
			.filter((target) => target.enabled);
		const settled = await settleWithConcurrency(
			targets,
			this.scanConcurrency(),
			(target) => this.scanKnownTarget(target),
		);

		return settled.reduce<SshScanAllResponse>(
			(response, result, index) => {
				if (result.status === "fulfilled") {
					response.results.push(result.value);
				} else {
					response.errors.push({
						targetId: targets[index]?.id || "unknown",
						message: errorMessage(result.reason),
					});
				}

				return response;
			},
			{ results: [], errors: [] },
		);
	}

	private async scanKnownTarget(target: SshTarget): Promise<SshScanResult> {
		const commandTimeoutMs = this.commandTimeoutMs();
		const client = await connectSshTarget(target, commandTimeoutMs);

		try {
			const [host, dockerApps, pm2Apps] = await Promise.all([
				collectSshHostMetrics(client, commandTimeoutMs),
				collectSshDockerApps(client, commandTimeoutMs),
				collectSshPm2Apps(client, commandTimeoutMs),
			]);
			const payload: ServerSnapshotPayload = {
				serverId: target.id,
				serverName: target.name,
				collectorVersion: `local-ssh/${this.version}`,
				observedAt: new Date().toISOString(),
				host,
				apps: [...dockerApps, ...pm2Apps],
			};
			const server = this.monitorOverviewService.ingestSnapshot(payload);

			return {
				targetId: target.id,
				serverId: server.serverId,
				serverName: server.serverName,
				appCount: server.apps.length,
				scannedAt: server.lastSeenAt,
			};
		} finally {
			client.end();
		}
	}
}
