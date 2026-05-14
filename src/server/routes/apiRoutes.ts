import { Router } from "express";
import { HealthController } from "../controllers/healthController";
import { HeartbeatController } from "../controllers/heartbeatController";
import { OverviewController } from "../controllers/overviewController";
import type { HealthService } from "../services/healthService";
import type { MonitorService } from "../services/monitorService";

interface ApiRouterDependencies {
  healthService: HealthService;
  ingestToken: string;
  monitorService: MonitorService;
}

export const createApiRouter = ({ healthService, ingestToken, monitorService }: ApiRouterDependencies) => {
  const router = Router();
  const healthController = new HealthController(healthService);
  const overviewController = new OverviewController(monitorService);
  const heartbeatController = new HeartbeatController(monitorService, ingestToken);

  router.get("/health", healthController.getHealth);
  router.get("/overview", overviewController.getOverview);
  router.post("/ingest/heartbeat", heartbeatController.ingestHeartbeat);

  return router;
};
