import { Router } from "express";
import type { AppMonitorRuleService } from "../services/appMonitorRuleService";
import type { AppLogsService } from "../services/appLogsService";
import type { HealthService } from "../services/healthService";
import type { HttpCheckService } from "../services/httpCheckService";
import type { LocalDockerScanService } from "../services/localDockerScanService";
import type { MonitorOverviewService } from "../services/monitorOverviewService";
import type { QuickActionService } from "../services/quickActionService";
import type { SshScanService } from "../services/sshScanService";
import type { SshTargetBootstrapService } from "../services/sshTargetBootstrapService";
import type { SshTargetConfigService } from "../services/sshTargetConfigService";
import type { SshTargetImportService } from "../services/sshTargetImportService";
import { createAppMonitorRuleRouter } from "./appMonitorRuleRoutes";
import { createHealthRouter } from "./healthRoutes";
import { createAppLogsRouter } from "./appLogsRoutes";
import { createHttpCheckRouter } from "./httpCheckRoutes";
import { createLocalDockerRouter } from "./localDockerRoutes";
import { createOverviewRouter } from "./overviewRoutes";
import { createQuickActionsRouter } from "./quickActionsRoutes";
import { createSshTargetRouter } from "./sshTargetRoutes";

interface ApiRouterDependencies {
  appMonitorRuleService: AppMonitorRuleService;
  appLogsService: AppLogsService;
  healthService: HealthService;
  httpCheckService: HttpCheckService;
  localDockerScanService: LocalDockerScanService;
  monitorOverviewService: MonitorOverviewService;
  quickActionService: QuickActionService;
  sshScanService: SshScanService;
  sshTargetBootstrapService: SshTargetBootstrapService;
  sshTargetConfigService: SshTargetConfigService;
  sshTargetImportService: SshTargetImportService;
}

export const createApiRouter = ({
  appMonitorRuleService,
  appLogsService,
  healthService,
  httpCheckService,
  localDockerScanService,
  monitorOverviewService,
  quickActionService,
  sshScanService,
  sshTargetBootstrapService,
  sshTargetConfigService,
  sshTargetImportService
}: ApiRouterDependencies) => {
  const router = Router();

  router.use(createAppMonitorRuleRouter(appMonitorRuleService));
  router.use(createAppLogsRouter(appLogsService));
  router.use(createHealthRouter(healthService));
  router.use(createHttpCheckRouter(httpCheckService));
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
