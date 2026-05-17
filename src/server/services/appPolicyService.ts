import type {
	AppPolicyCreateInput,
	AppPolicyOverrideInput,
	AppPolicyUpdateInput,
} from "../../shared/types";
import type { AppPolicyStore } from "../stores/appPolicyStore";
import type { MonitorOverviewService } from "./monitorOverviewService";

export class AppPolicyService {
	constructor(
		private readonly appPolicyStore: AppPolicyStore,
		private readonly monitorOverviewService: MonitorOverviewService,
	) {}

	listPolicies() {
		return this.appPolicyStore.list();
	}

	createPolicy(input: AppPolicyCreateInput) {
		const policy = this.appPolicyStore.create(input);
		this.monitorOverviewService.refreshOverview();

		return policy;
	}

	updatePolicy(policyId: string, input: AppPolicyUpdateInput) {
		const policy = this.appPolicyStore.update(policyId, input);
		if (policy) this.monitorOverviewService.refreshOverview();

		return policy;
	}

	upsertAppOverride(input: AppPolicyOverrideInput) {
		const policy = this.appPolicyStore.upsertAppOverride(input);
		this.monitorOverviewService.refreshOverview();

		return policy;
	}

	deletePolicy(policyId: string) {
		const deleted = this.appPolicyStore.delete(policyId);
		if (deleted) this.monitorOverviewService.refreshOverview();

		return deleted;
	}
}
