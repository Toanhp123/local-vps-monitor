import { errorMessage } from "../lib/errorMessage";
import { localDockerServerId } from "../domain/servers/serverIds";
import type { HttpCheckService } from "./httpCheckService";
import type { LocalDockerScanService } from "./localDockerScanService";
import type { SshScanService } from "./sshScanService";

export class AutoScanScheduler {
	private timer?: NodeJS.Timeout;
	private readonly activeServerIds = new Set<string>();
	private httpChecksRunning = false;
	private lastHttpCheckAt = 0;
	private lastLocalDockerError = "";
	private readonly lastServerScanAt = new Map<string, number>();

	constructor(
		private readonly sshScanService: SshScanService,
		private readonly localDockerScanService: LocalDockerScanService,
		private readonly httpCheckService: HttpCheckService,
		private readonly autoScanIntervalMs: (serverId: string) => number,
		private httpCheckIntervalMs: number,
	) {}

	start() {
		if (this.timer) return;

		this.timer = setInterval(() => {
			void this.scanDue();
		}, 1_000);
		this.timer.unref?.();

		void this.scanDue();
	}

	updateInterval(intervalMs: number) {
		this.httpCheckIntervalMs = Math.max(0, Math.round(intervalMs));
		void this.scanDue();
	}

	stop() {
		if (!this.timer) return;

		clearInterval(this.timer);
		this.timer = undefined;
	}

	private async scanDue() {
		const now = Date.now();
		const sshTargetIds = this.sshScanService.listEnabledTargetIds();
		const serverIds = [localDockerServerId, ...sshTargetIds];
		const currentServerIds = new Set(serverIds);
		const dueSshTargetIds: string[] = [];
		const tasks: Array<Promise<void>> = [];

		for (const serverId of this.lastServerScanAt.keys()) {
			if (!currentServerIds.has(serverId)) {
				this.lastServerScanAt.delete(serverId);
			}
		}

		for (const serverId of serverIds) {
			const intervalMs = Math.max(
				0,
				Math.round(this.autoScanIntervalMs(serverId)),
			);
			if (intervalMs <= 0 || this.activeServerIds.has(serverId)) continue;

			const lastScanAt = this.lastServerScanAt.get(serverId);
			if (lastScanAt !== undefined && now - lastScanAt < intervalMs) {
				continue;
			}

			this.lastServerScanAt.set(serverId, now);

			if (serverId === localDockerServerId) {
				tasks.push(this.scanLocalDocker());
			} else {
				dueSshTargetIds.push(serverId);
			}
		}

		if (dueSshTargetIds.length > 0) {
			tasks.push(this.scanSshTargets(dueSshTargetIds));
		}

		if (
			this.httpCheckIntervalMs > 0 &&
			!this.httpChecksRunning &&
			(now - this.lastHttpCheckAt >= this.httpCheckIntervalMs ||
				this.lastHttpCheckAt === 0)
		) {
			this.lastHttpCheckAt = now;
			tasks.push(this.runHttpChecks());
		}

		await Promise.allSettled(tasks);
	}

	private async scanSshTargets(targetIds: string[]) {
		for (const targetId of targetIds) {
			this.activeServerIds.add(targetId);
		}

		try {
			const result = await this.sshScanService.scanTargets(targetIds);

			if (result.results.length > 0 || result.errors.length > 0) {
				console.log(
					`Auto SSH scan finished: ${result.results.length} VPS scanned, ${result.errors.length} failed`,
				);

				if (result.errors.length > 0) {
					console.warn(
						`Auto SSH scan errors: ${result.errors.map((entry) => `${entry.targetId}: ${entry.message}`).join("; ")}`,
					);
				}
			}
		} catch (error) {
			console.warn(`Auto SSH scan failed: ${errorMessage(error)}`);
		} finally {
			for (const targetId of targetIds) {
				this.activeServerIds.delete(targetId);
			}
		}
	}

	private async scanLocalDocker() {
		this.activeServerIds.add(localDockerServerId);

		try {
			const result = await this.localDockerScanService.scanLocalDocker();
			this.lastLocalDockerError = "";
			console.log(
				`Auto Local Docker scan finished: ${result.appCount} apps scanned`,
			);
		} catch (error) {
			const message = errorMessage(error);

			if (message !== this.lastLocalDockerError) {
				this.lastLocalDockerError = message;
				console.warn(`Auto Local Docker scan failed: ${message}`);
			}
		} finally {
			this.activeServerIds.delete(localDockerServerId);
		}
	}

	private async runHttpChecks() {
		this.httpChecksRunning = true;

		try {
			const result = await this.httpCheckService.runAllChecks();

			if (result.results.length > 0 || result.errors.length > 0) {
				console.log(
					`Auto HTTP checks finished: ${result.results.length} checked, ${result.errors.length} failed`,
				);
			}
		} catch (error) {
			console.warn(`Auto HTTP checks failed: ${errorMessage(error)}`);
		} finally {
			this.httpChecksRunning = false;
		}
	}
}
