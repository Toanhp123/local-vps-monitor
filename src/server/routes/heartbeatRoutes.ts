import { Router } from "express";
import { HeartbeatController } from "../controllers/heartbeatController";
import type { MonitorOverviewService } from "../services/monitorOverviewService";

export const createHeartbeatRouter = (monitorOverviewService: MonitorOverviewService, ingestToken: string) => {
  const router = Router();
  const heartbeatController = new HeartbeatController(monitorOverviewService, ingestToken);

  router.post("/ingest/heartbeat", heartbeatController.ingestHeartbeat);

  return router;
};
