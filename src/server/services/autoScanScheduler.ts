import { errorMessage } from "../lib/errorMessage";
import type { SshScanService } from "./sshScanService";

export class AutoScanScheduler {
  private timer?: NodeJS.Timeout;
  private isRunning = false;

  constructor(
    private readonly sshScanService: SshScanService,
    private readonly intervalMs: number
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
      const result = await this.sshScanService.scanAllTargets();
      if (result.results.length === 0 && result.errors.length === 0) return;

      console.log(
        `Auto scan finished: ${result.results.length} VPS scanned, ${result.errors.length} failed`
      );

      if (result.errors.length > 0) {
        console.warn(
          `Auto scan errors: ${result.errors.map((entry) => `${entry.targetId}: ${entry.message}`).join("; ")}`
        );
      }
    } catch (error) {
      console.warn(`Auto scan failed: ${errorMessage(error)}`);
    } finally {
      this.isRunning = false;
    }
  }
}
