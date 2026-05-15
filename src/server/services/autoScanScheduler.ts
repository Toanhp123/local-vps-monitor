import { errorMessage } from "../lib/errorMessage";
import type { LocalDockerScanService } from "./localDockerScanService";
import type { SshScanService } from "./sshScanService";

export class AutoScanScheduler {
	private timer?: NodeJS.Timeout;
	private isRunning = false;
	private lastLocalDockerError = "";

	constructor(
		private readonly sshScanService: SshScanService,
		private readonly localDockerScanService: LocalDockerScanService,
		private readonly intervalMs: number,
	) {}

	start() {
		if (this.intervalMs <= 0 || this.timer) return;

		this.timer = setInterval(() => {
			void this.scan();
		}, this.intervalMs);
		this.timer.unref?.();

		void this.scan();
	}

	stop() {
		if (!this.timer) return;

		clearInterval(this.timer);
		this.timer = undefined;
	}

	private async scan() {
		if (this.isRunning) return;

		this.isRunning = true;

		try {
			const [sshScan, localDockerScan] = await Promise.allSettled([
				this.sshScanService.scanAllTargets(),
				this.localDockerScanService.scanLocalDocker(),
			]);

			if (sshScan.status === "fulfilled") {
				const result = sshScan.value;

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
			} else {
				console.warn(
					`Auto SSH scan failed: ${errorMessage(sshScan.reason)}`,
				);
			}

			if (localDockerScan.status === "fulfilled") {
				this.lastLocalDockerError = "";
				console.log(
					`Auto Local Docker scan finished: ${localDockerScan.value.appCount} apps scanned`,
				);
			} else {
				const message = errorMessage(localDockerScan.reason);

				if (message !== this.lastLocalDockerError) {
					this.lastLocalDockerError = message;
					console.warn(`Auto Local Docker scan failed: ${message}`);
				}
			}
		} catch (error) {
			console.warn(`Auto scan failed: ${errorMessage(error)}`);
		} finally {
			this.isRunning = false;
		}
	}
}
