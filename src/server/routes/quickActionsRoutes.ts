import { Router } from "express";
import { QuickActionsController } from "../controllers/quickActionsController";
import type { QuickActionService } from "../services/quickActionService";

export const createQuickActionsRouter = (
	quickActionService: QuickActionService,
) => {
	const router = Router();
	const quickActionsController = new QuickActionsController(
		quickActionService,
	);

	router.post("/quick-actions/run", quickActionsController.runQuickAction);

	return router;
};
