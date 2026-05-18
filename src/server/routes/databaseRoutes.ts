import { Router } from "express";
import { DatabaseController } from "../controllers/databaseController";
import type { DatabaseService } from "../services/databaseService";

export const createDatabaseRouter = (databaseService: DatabaseService) => {
	const router = Router();
	const controller = new DatabaseController(databaseService);

	router.get("/stats", controller.getStats);
	router.get("/settings", controller.getSettings);
	router.put("/settings", controller.updateSettings);
	router.post("/cleanup", controller.cleanupOldData);
	router.post("/vacuum", controller.vacuum);

	return router;
};
