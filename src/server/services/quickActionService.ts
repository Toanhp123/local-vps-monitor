import type {
	QuickActionRunInput,
	QuickActionRunResponse,
} from "../../shared/types";
import {
	buildQuickAction,
	isQuickActionId,
	quickActionRequiresApp,
} from "../domain/quickActions/quickActionCatalog";
import {
	QuickActionNotFoundError,
	QuickActionUnsupportedError,
} from "../domain/quickActions/quickActionErrors";
import { QuickActionRunner } from "../integrations/quickActions/quickActionRunner";
import type { SshTargetConfigStore } from "../stores/sshTargetConfigStore";
import type { MonitorOverviewService } from "./monitorOverviewService";
import { createQuickActionResponse } from "./quickActionResponseMapper";

export {
	isQuickActionId,
	QuickActionNotFoundError,
	QuickActionUnsupportedError,
};

export class QuickActionService {
	private readonly runner: QuickActionRunner;

	constructor(
		private readonly monitorOverviewService: MonitorOverviewService,
		private readonly targetConfigStore: SshTargetConfigStore,
		localDockerCommandTimeoutMs: number,
		sshCommandTimeoutMs: number,
	) {
		this.runner = new QuickActionRunner(
			localDockerCommandTimeoutMs,
			sshCommandTimeoutMs,
		);
	}

	async runQuickAction(
		input: QuickActionRunInput,
	): Promise<QuickActionRunResponse> {
		const server = this.monitorOverviewService.getServer(input.serverId);
		if (!server) {
			throw new QuickActionNotFoundError(
				`Server not found: ${input.serverId}`,
			);
		}

		const requiresApp = quickActionRequiresApp(input.actionId);
		const app = requiresApp
			? server.apps.find((item) => item.id === input.appId)
			: undefined;

		if (requiresApp && !app) {
			throw new QuickActionNotFoundError(
				`App not found: ${input.appId || "missing"}`,
			);
		}

		const action = buildQuickAction({
			actionId: input.actionId,
			app,
			serverId: input.serverId,
		});
		const target =
			action.execution.kind === "remote"
				? this.targetConfigStore.get(input.serverId)
				: undefined;

		if (action.execution.kind === "remote" && !target) {
			throw new QuickActionNotFoundError(
				`SSH target not found: ${input.serverId}`,
			);
		}

		const result = await this.runner.run(action.execution, target);

		return createQuickActionResponse({
			action,
			result,
			serverId: input.serverId,
		});
	}
}
