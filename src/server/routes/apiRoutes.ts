import { Router } from "express";
import type { ServerAlertPolicyService } from "../services/serverAlertPolicyService";
import type { AppPolicyService } from "../services/appPolicyService";
import type { AppLogsService } from "../services/appLogsService";
import type { HealthService } from "../services/healthService";
import type { HttpCheckService } from "../services/httpCheckService";
import type { IncidentStateService } from "../services/incidentStateService";
import type { LocalDockerScanService } from "../services/localDockerScanService";
import type { MonitorOverviewService } from "../services/monitorOverviewService";
import type { QuickActionService } from "../services/quickActionService";
import type { SshScanService } from "../services/sshScanService";
import type { SshTargetBootstrapService } from "../services/sshTargetBootstrapService";
import type { SshTargetConfigService } from "../services/sshTargetConfigService";
import type { SshTargetImportService } from "../services/sshTargetImportService";
import type { MonitorRuntimeService } from "../services/monitorRuntimeService";
import type { DatabaseService } from "../services/databaseService";
import { createServerAlertPolicyRouter } from "./serverAlertPolicyRoutes";
import { createAppPolicyRouter } from "./appPolicyRoutes";
import { createHealthRouter } from "./healthRoutes";
import { createAppLogsRouter } from "./appLogsRoutes";
import { createHttpCheckRouter } from "./httpCheckRoutes";
import { createIncidentStateRouter } from "./incidentStateRoutes";
import { createLocalDockerRouter } from "./localDockerRoutes";
import { createOverviewRouter } from "./overviewRoutes";
import { createQuickActionsRouter } from "./quickActionsRoutes";
import { createSshTargetRouter } from "./sshTargetRoutes";
import { createMonitorRuntimeRouter } from "./monitorRuntimeRoutes";
import { createDatabaseRouter } from "./databaseRoutes";

interface ApiRouterDependencies {
  serverAlertPolicyService: ServerAlertPolicyService;
  appPolicyService: AppPolicyService;
  appLogsService: AppLogsService;
  healthService: HealthService;
  httpCheckService: HttpCheckService;
  incidentStateService: IncidentStateService;
  localDockerScanService: LocalDockerScanService;
  monitorOverviewService: MonitorOverviewService;
  quickActionService: QuickActionService;
  sshScanService: SshScanService;
  sshTargetBootstrapService: SshTargetBootstrapService;
  sshTargetConfigService: SshTargetConfigService;
  sshTargetImportService: SshTargetImportService;
  monitorRuntimeService: MonitorRuntimeService;
  databaseService: DatabaseService;
}

export const createApiRouter = ({
  serverAlertPolicyService,
  appPolicyService,
  appLogsService,
  healthService,
  httpCheckService,
  incidentStateService,
  localDockerScanService,
  monitorOverviewService,
  quickActionService,
  sshScanService,
  sshTargetBootstrapService,
  sshTargetConfigService,
  sshTargetImportService,
  monitorRuntimeService,
  databaseService
}: ApiRouterDependencies) => {
  const router = Router();

  router.use(createServerAlertPolicyRouter(serverAlertPolicyService));
  router.use(createAppPolicyRouter(appPolicyService));
  router.use(createAppLogsRouter(appLogsService));
  router.use(createHealthRouter(healthService));
  router.use(createHttpCheckRouter(httpCheckService));
  router.use(createIncidentStateRouter(incidentStateService));
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
  router.use(createMonitorRuntimeRouter(monitorRuntimeService));
  router.use("/database", createDatabaseRouter(databaseService));

  return router;
};
