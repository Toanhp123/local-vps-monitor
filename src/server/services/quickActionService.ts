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
import { quickActionResponse } from "../domain/quickActions/quickActionResponse";
import { QuickActionRunner } from "../integrations/quickActions/quickActionRunner";
import type { SshTargetConfigStore } from "../models/sshTargetConfigStore";
import type { MonitorOverviewService } from "./monitorOverviewService";

export {
	isQuickActionId,
	QuickActionNotFoundError,
	QuickActionUnsupportedError,
};

export class QuickActionService {
	private readonly runner: QuickActionRunner;

	constructor(
		private readonly monitorOverviewService: MonitorOverviewService,
		targetConfigStore: SshTargetConfigStore,
		localDockerCommandTimeoutMs: number,
		sshCommandTimeoutMs: number,
	) {
		this.runner = new QuickActionRunner(
			targetConfigStore,
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
		const result = await this.runner.run(input.serverId, action.execution);

		return quickActionResponse({
			action,
			result,
			serverId: input.serverId,
		});
	}
}
