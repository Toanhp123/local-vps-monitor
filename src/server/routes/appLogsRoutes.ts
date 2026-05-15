import { Router } from "express";
import { AppLogsController } from "../controllers/appLogsController";
import type { AppLogsService } from "../services/appLogsService";

export const createAppLogsRouter = (appLogsService: AppLogsService) => {
	const router = Router();
	const appLogsController = new AppLogsController(appLogsService);

	router.get(
		"/servers/:serverId/apps/:appId/logs",
		appLogsController.getAppLogs,
	);

	return router;
};
