import { Router } from "express";
import { OverviewController } from "../controllers/overviewController";
import type { MonitorOverviewService } from "../services/monitorOverviewService";

export const createOverviewRouter = (monitorOverviewService: MonitorOverviewService) => {
  const router = Router();
  const overviewController = new OverviewController(monitorOverviewService);

  router.get("/overview", overviewController.getOverview);

  return router;
};
