import { runLocalCommand } from "../local/localCommandRunner";
import { connectSshTarget, runSshCommand } from "../ssh/sshCommandRunner";
import type { QuickActionExecution } from "../../domain/quickActions/quickActionCatalog";
import { QuickActionNotFoundError } from "../../domain/quickActions/quickActionErrors";
import type { SshTargetConfigStore } from "../../models/sshTargetConfigStore";

export interface QuickActionCommandResult {
	code?: number;
	ok: boolean;
	stderr: string;
	stdout: string;
}

export class QuickActionRunner {
	constructor(
		private readonly targetConfigStore: SshTargetConfigStore,
		private readonly localDockerCommandTimeoutMs: number,
		private readonly sshCommandTimeoutMs: number,
	) {}

	async run(
		serverId: string,
		execution: QuickActionExecution,
	): Promise<QuickActionCommandResult> {
		if (execution.kind === "local") {
			return runLocalCommand(
				execution.file,
				execution.args,
				this.localDockerCommandTimeoutMs,
			);
		}

		const target = this.targetConfigStore.get(serverId);
		if (!target) {
			throw new QuickActionNotFoundError(`SSH target not found: ${serverId}`);
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
