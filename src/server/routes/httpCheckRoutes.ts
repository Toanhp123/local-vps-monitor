import { Router } from "express";
import { HttpChecksController } from "../controllers/httpChecksController";
import type { HttpCheckService } from "../services/httpCheckService";

export const createHttpCheckRouter = (
	httpCheckService: HttpCheckService,
) => {
	const router = Router();
	const httpChecksController = new HttpChecksController(httpCheckService);

	router.get("/http-checks", httpChecksController.listChecks);
	router.post("/http-checks", httpChecksController.createCheck);
	router.post("/http-checks/run-all", httpChecksController.runAllChecks);
	router.post("/http-checks/:checkId/run", httpChecksController.runCheck);
	router.patch("/http-checks/:checkId", httpChecksController.updateCheck);
	router.delete("/http-checks/:checkId", httpChecksController.deleteCheck);

	return router;
};
