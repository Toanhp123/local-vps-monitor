import { Router } from "express";
import { IncidentStateController } from "../controllers/incidentStateController";
import type { IncidentStateService } from "../services/incidentStateService";

export const createIncidentStateRouter = (
	incidentStateService: IncidentStateService,
) => {
	const router = Router();
	const incidentStateController = new IncidentStateController(
		incidentStateService,
	);

	router.get("/incident-state", incidentStateController.getState);
	router.put("/incident-state", incidentStateController.replaceState);
	router.get("/incident-actions", incidentStateController.getState);
	router.put("/incident-actions", incidentStateController.replaceState);

	return router;
};
