import { Router } from "express";
import type { HealthService } from "../services/healthService";
import type { MonitorOverviewService } from "../services/monitorOverviewService";
import type { SshScanService } from "../services/sshScanService";
import type { SshTargetConfigService } from "../services/sshTargetConfigService";
import { createHealthRouter } from "./healthRoutes";
import { createHeartbeatRouter } from "./heartbeatRoutes";
import { createOverviewRouter } from "./overviewRoutes";
import { createSshTargetRouter } from "./sshTargetRoutes";

interface ApiRouterDependencies {
  healthService: HealthService;
  ingestToken: string;
  monitorOverviewService: MonitorOverviewService;
  sshScanService: SshScanService;
  sshTargetConfigService: SshTargetConfigService;
}

export const createApiRouter = ({
  healthService,
  ingestToken,
  monitorOverviewService,
  sshScanService,
  sshTargetConfigService
}: ApiRouterDependencies) => {
  const router = Router();

  router.use(createHealthRouter(healthService));
  router.use(createOverviewRouter(monitorOverviewService));
  router.use(createHeartbeatRouter(monitorOverviewService, ingestToken));
  router.use(createSshTargetRouter(sshTargetConfigService, sshScanService));

  return router;
};
