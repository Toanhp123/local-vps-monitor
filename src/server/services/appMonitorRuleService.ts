import type {
	AppMonitorAppOverrideInput,
	AppMonitorRuleCreateInput,
	AppMonitorRuleUpdateInput,
} from "../../shared/types";
import type { AppMonitorRuleStore } from "../stores/appMonitorRuleStore";
import type { MonitorOverviewService } from "./monitorOverviewService";

export class AppMonitorRuleService {
	constructor(
		private readonly appMonitorRuleStore: AppMonitorRuleStore,
		private readonly monitorOverviewService: MonitorOverviewService,
	) {}

	listRules() {
		return this.appMonitorRuleStore.list();
	}

	createRule(input: AppMonitorRuleCreateInput) {
		const rule = this.appMonitorRuleStore.create(input);
		this.monitorOverviewService.refreshOverview();

		return rule;
	}

	updateRule(ruleId: string, input: AppMonitorRuleUpdateInput) {
		const rule = this.appMonitorRuleStore.update(ruleId, input);
		if (rule) this.monitorOverviewService.refreshOverview();

		return rule;
	}

	upsertAppOverride(input: AppMonitorAppOverrideInput) {
		const rule = this.appMonitorRuleStore.upsertAppOverride(input);
		this.monitorOverviewService.refreshOverview();

		return rule;
	}

	deleteRule(ruleId: string) {
		const deleted = this.appMonitorRuleStore.delete(ruleId);
		if (deleted) this.monitorOverviewService.refreshOverview();

		return deleted;
	}
}
