import { runLocalCommand } from "../local/localCommandRunner";
import { connectSshTarget, runSshCommand } from "../ssh/sshCommandRunner";
import type { QuickActionExecution } from "../../domain/quickActions/quickActionCatalog";
import type { SshTarget } from "../../../shared/types";

export interface QuickActionCommandResult {
	code?: number;
	ok: boolean;
	stderr: string;
	stdout: string;
}

export class QuickActionRunner {
	constructor(
		private readonly localDockerCommandTimeoutMs: number,
		private readonly sshCommandTimeoutMs: number,
	) {}

	async run(
		execution: QuickActionExecution,
		target?: SshTarget,
	): Promise<QuickActionCommandResult> {
		if (execution.kind === "local") {
			return runLocalCommand(
				execution.file,
				execution.args,
				this.localDockerCommandTimeoutMs,
			);
		}

		if (!target) {
			throw new Error("Remote quick action requires an SSH target.");
		}

		const client = await connectSshTarget(target, this.sshCommandTimeoutMs);

		try {
			return await runSshCommand(
				client,
				execution.command,
				this.sshCommandTimeoutMs,
			);
		} finally {
			client.end();
		}
	}
}
