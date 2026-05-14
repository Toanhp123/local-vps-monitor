import { Router } from "express";
import type { HealthService } from "../services/healthService";
import type { MonitorOverviewService } from "../services/monitorOverviewService";
import type { SshScanService } from "../services/sshScanService";
import type { SshTargetConfigService } from "../services/sshTargetConfigService";
import { createHealthRouter } from "./healthRoutes";
import { createOverviewRouter } from "./overviewRoutes";
import { createSshTargetRouter } from "./sshTargetRoutes";

interface ApiRouterDependencies {
  healthService: HealthService;
  monitorOverviewService: MonitorOverviewService;
  sshScanService: SshScanService;
  sshTargetConfigService: SshTargetConfigService;
}

export const createApiRouter = ({
  healthService,
  monitorOverviewService,
  sshScanService,
  sshTargetConfigService
}: ApiRouterDependencies) => {
  const router = Router();

  router.use(createHealthRouter(healthService));
  router.use(createOverviewRouter(monitorOverviewService));
  router.use(createSshTargetRouter(sshTargetConfigService, sshScanService));

  return router;
};
