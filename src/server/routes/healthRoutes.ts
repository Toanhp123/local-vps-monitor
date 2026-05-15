import { Router } from "express";
import { HealthController } from "../controllers/healthController";
import type { HealthService } from "../services/healthService";

export const createHealthRouter = (healthService: HealthService) => {
	const router = Router();
	const healthController = new HealthController(healthService);

	router.get("/health", healthController.getHealth);

	return router;
};
