import { Router } from "express";
import { MonitorRuntimeController } from "../controllers/monitorRuntimeController";
import type { MonitorRuntimeService } from "../services/monitorRuntimeService";

export const createMonitorRuntimeRouter = (
	monitorRuntimeService: MonitorRuntimeService,
) => {
	const router = Router();
	const monitorRuntimeController = new MonitorRuntimeController(
		monitorRuntimeService,
	);

	router.get("/monitor-runtime", monitorRuntimeController.getSettings);
	router.put("/monitor-runtime", monitorRuntimeController.updateSettings);
	router.get("/system-settings", monitorRuntimeController.getSettings);
	router.put("/system-settings", monitorRuntimeController.updateSettings);

	return router;
};
