import { Router } from "express";
import type { AppLogsService } from "../services/appLogsService";
import type { HealthService } from "../services/healthService";
import type { LocalDockerScanService } from "../services/localDockerScanService";
import type { MonitorOverviewService } from "../services/monitorOverviewService";
import type { SshScanService } from "../services/sshScanService";
import type { SshTargetConfigService } from "../services/sshTargetConfigService";
import { createHealthRouter } from "./healthRoutes";
import { createAppLogsRouter } from "./appLogsRoutes";
import { createLocalDockerRouter } from "./localDockerRoutes";
import { createOverviewRouter } from "./overviewRoutes";
import { createSshTargetRouter } from "./sshTargetRoutes";

interface ApiRouterDependencies {
  appLogsService: AppLogsService;
  healthService: HealthService;
  localDockerScanService: LocalDockerScanService;
  monitorOverviewService: MonitorOverviewService;
  sshScanService: SshScanService;
  sshTargetConfigService: SshTargetConfigService;
}

export const createApiRouter = ({
  appLogsService,
  healthService,
  localDockerScanService,
  monitorOverviewService,
  sshScanService,
  sshTargetConfigService
}: ApiRouterDependencies) => {
  const router = Router();

  router.use(createAppLogsRouter(appLogsService));
  router.use(createHealthRouter(healthService));
  router.use(createLocalDockerRouter(localDockerScanService));
  router.use(createOverviewRouter(monitorOverviewService));
  router.use(createSshTargetRouter(sshTargetConfigService, sshScanService));

  return router;
};
