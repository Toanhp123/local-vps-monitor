import { Router } from "express";
import type { AppLogsService } from "../services/appLogsService";
import type { HealthService } from "../services/healthService";
import type { LocalDockerScanService } from "../services/localDockerScanService";
import type { MonitorOverviewService } from "../services/monitorOverviewService";
import type { QuickActionService } from "../services/quickActionService";
import type { SshScanService } from "../services/sshScanService";
import type { SshTargetBootstrapService } from "../services/sshTargetBootstrapService";
import type { SshTargetConfigService } from "../services/sshTargetConfigService";
import type { SshTargetImportService } from "../services/sshTargetImportService";
import { createHealthRouter } from "./healthRoutes";
import { createAppLogsRouter } from "./appLogsRoutes";
import { createLocalDockerRouter } from "./localDockerRoutes";
import { createOverviewRouter } from "./overviewRoutes";
import { createQuickActionsRouter } from "./quickActionsRoutes";
import { createSshTargetRouter } from "./sshTargetRoutes";

interface ApiRouterDependencies {
  appLogsService: AppLogsService;
  healthService: HealthService;
  localDockerScanService: LocalDockerScanService;
  monitorOverviewService: MonitorOverviewService;
  quickActionService: QuickActionService;
  sshScanService: SshScanService;
  sshTargetBootstrapService: SshTargetBootstrapService;
  sshTargetConfigService: SshTargetConfigService;
  sshTargetImportService: SshTargetImportService;
}

export const createApiRouter = ({
  appLogsService,
  healthService,
  localDockerScanService,
  monitorOverviewService,
  quickActionService,
  sshScanService,
  sshTargetBootstrapService,
  sshTargetConfigService,
  sshTargetImportService
}: ApiRouterDependencies) => {
  const router = Router();

  router.use(createAppLogsRouter(appLogsService));
  router.use(createHealthRouter(healthService));
  router.use(createLocalDockerRouter(localDockerScanService));
  router.use(createOverviewRouter(monitorOverviewService));
  router.use(createQuickActionsRouter(quickActionService));
  router.use(
    createSshTargetRouter(
      sshTargetConfigService,
      sshScanService,
      sshTargetBootstrapService,
      sshTargetImportService
    )
  );

  return router;
};
