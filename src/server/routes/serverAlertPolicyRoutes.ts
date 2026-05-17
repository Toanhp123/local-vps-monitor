import { Router } from "express";
import { ServerAlertPolicyController } from "../controllers/serverAlertPolicyController";
import type { ServerAlertPolicyService } from "../services/serverAlertPolicyService";

export const createServerAlertPolicyRouter = (
	serverAlertPolicyService: ServerAlertPolicyService,
) => {
	const router = Router();
	const serverAlertPolicyController = new ServerAlertPolicyController(serverAlertPolicyService);

	router.get("/server-alert-policy", serverAlertPolicyController.getPolicy);
	router.put("/server-alert-policy", serverAlertPolicyController.updatePolicy);
	router.get("/alert-policy", serverAlertPolicyController.getPolicy);
	router.put("/alert-policy", serverAlertPolicyController.updatePolicy);

	return router;
};
