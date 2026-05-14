import { Router } from "express";
import { HealthController } from "../controllers/healthController";
import { HeartbeatController } from "../controllers/heartbeatController";
import { OverviewController } from "../controllers/overviewController";
import { SshTargetsController } from "../controllers/sshTargetsController";
import type { HealthService } from "../services/healthService";
import type { MonitorOverviewService } from "../services/monitorOverviewService";
import type { SshScanService } from "../services/sshScanService";

interface ApiRouterDependencies {
  healthService: HealthService;
  ingestToken: string;
  monitorOverviewService: MonitorOverviewService;
  sshScanService: SshScanService;
}

export const createApiRouter = ({
  healthService,
  ingestToken,
  monitorOverviewService,
  sshScanService
}: ApiRouterDependencies) => {
  const router = Router();
  const healthController = new HealthController(healthService);
  const overviewController = new OverviewController(monitorOverviewService);
  const heartbeatController = new HeartbeatController(monitorOverviewService, ingestToken);
  const sshTargetsController = new SshTargetsController(sshScanService);

  router.get("/health", healthController.getHealth);
  router.get("/overview", overviewController.getOverview);
  router.post("/ingest/heartbeat", heartbeatController.ingestHeartbeat);
  router.get("/ssh-targets", sshTargetsController.listTargets);
  router.post("/ssh-targets", sshTargetsController.createTarget);
  router.post("/ssh-targets/scan-all", sshTargetsController.scanAllTargets);
  router.post("/ssh-targets/:targetId/scan", sshTargetsController.scanTarget);
  router.delete("/ssh-targets/:targetId", sshTargetsController.deleteTarget);

  return router;
};
