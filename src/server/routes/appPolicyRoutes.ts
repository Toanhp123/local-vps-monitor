import { Router } from "express";
import { AppPoliciesController } from "../controllers/appPolicyController";
import type { AppPolicyService } from "../services/appPolicyService";

export const createAppPolicyRouter = (
	appPolicyService: AppPolicyService,
) => {
	const router = Router();
	const appPoliciesController = new AppPoliciesController(
		appPolicyService,
	);

	router.get("/app-policies", appPoliciesController.listPolicies);
	router.post("/app-policies", appPoliciesController.createPolicy);
	router.put(
		"/app-policies/app-override",
		appPoliciesController.upsertAppOverride,
	);
	router.patch(
		"/app-policies/:policyId",
		appPoliciesController.updatePolicy,
	);
	router.delete(
		"/app-policies/:policyId",
		appPoliciesController.deletePolicy,
	);
	router.get("/app-monitor-rules", appPoliciesController.listPolicies);
	router.post("/app-monitor-rules", appPoliciesController.createPolicy);
	router.put(
		"/app-monitor-rules/app-override",
		appPoliciesController.upsertAppOverride,
	);
	router.patch(
		"/app-monitor-rules/:policyId",
		appPoliciesController.updatePolicy,
	);
	router.delete(
		"/app-monitor-rules/:policyId",
		appPoliciesController.deletePolicy,
	);

	return router;
};
