import { Router } from "express";
import { LocalDockerController } from "../controllers/localDockerController";
import type { LocalDockerScanService } from "../services/localDockerScanService";

export const createLocalDockerRouter = (
	localDockerScanService: LocalDockerScanService,
) => {
	const router = Router();
	const localDockerController = new LocalDockerController(
		localDockerScanService,
	);

	router.post("/local-docker/scan", localDockerController.scanLocalDocker);

	return router;
};
