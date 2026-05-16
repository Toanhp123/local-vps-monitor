import { Router } from "express";
import { AppMonitorRulesController } from "../controllers/appMonitorRulesController";
import type { AppMonitorRuleService } from "../services/appMonitorRuleService";

export const createAppMonitorRuleRouter = (
	appMonitorRuleService: AppMonitorRuleService,
) => {
	const router = Router();
	const appMonitorRulesController = new AppMonitorRulesController(
		appMonitorRuleService,
	);

	router.get("/app-monitor-rules", appMonitorRulesController.listRules);
	router.post("/app-monitor-rules", appMonitorRulesController.createRule);
	router.put(
		"/app-monitor-rules/app-override",
		appMonitorRulesController.upsertAppOverride,
	);
	router.patch(
		"/app-monitor-rules/:ruleId",
		appMonitorRulesController.updateRule,
	);
	router.delete(
		"/app-monitor-rules/:ruleId",
		appMonitorRulesController.deleteRule,
	);

	return router;
};
