import type { ServerAlertPolicyUpdateInput } from "../../shared/types";
import type { ServerAlertPolicyStore } from "../stores/serverAlertPolicyStore";
import type { MonitorOverviewService } from "./monitorOverviewService";

export class ServerAlertPolicyService {
	constructor(
		private readonly serverAlertPolicyStore: ServerAlertPolicyStore,
		private readonly monitorOverviewService: MonitorOverviewService,
	) {}

	getPolicy() {
		return this.serverAlertPolicyStore.get();
	}

	updatePolicy(input: ServerAlertPolicyUpdateInput) {
		const policy = this.serverAlertPolicyStore.replace(input);
		this.monitorOverviewService.refreshOverview();

		return policy;
	}
}
