import express, { type Express } from "express";
import fs from "node:fs";
import path from "node:path";
import { serverConfig } from "./config";
import { localAccessGuard } from "./middleware/localAccessGuard";
import { MonitorStateStore } from "./models/monitorStateStore";
import { SshTargetConfigStore } from "./models/sshTargetConfigStore";
import { createApiRouter } from "./routes/apiRoutes";
import { AppLogsService } from "./services/appLogsService";
import { HealthService } from "./services/healthService";
import { LocalDockerScanService } from "./services/localDockerScanService";
import { MonitorOverviewService } from "./services/monitorOverviewService";
import { SshScanService } from "./services/sshScanService";
import { SshTargetConfigService } from "./services/sshTargetConfigService";

const mountClientApp = (app: Express) => {
  const clientDist = path.resolve(process.cwd(), "dist/client");
  const indexHtml = path.join(clientDist, "index.html");

  if (!fs.existsSync(indexHtml)) return;

  app.use(express.static(clientDist));
  app.use((request, response, next) => {
    if (request.path.startsWith("/api")) {
      next();
      return;
    }

    response.sendFile(indexHtml);
  });
};

export interface ServerAppContext {
  app: Express;
  localDockerScanService: LocalDockerScanService;
  monitorOverviewService: MonitorOverviewService;
  sshScanService: SshScanService;
}

export const createApp = () => {
  const app = express();
  const monitorStateStore = new MonitorStateStore(serverConfig.dataFile);
  const sshTargetConfigStore = new SshTargetConfigStore(serverConfig.sshTargetsFile);
  const monitorOverviewService = new MonitorOverviewService(monitorStateStore, serverConfig.offlineAfterMs);
  const localDockerScanService = new LocalDockerScanService(
    monitorOverviewService,
    serverConfig.localDockerCommandTimeoutMs,
    serverConfig.version
  );
  const sshTargetConfigService = new SshTargetConfigService(sshTargetConfigStore);
  const sshScanService = new SshScanService(
    sshTargetConfigStore,
    monitorOverviewService,
    serverConfig.sshCommandTimeoutMs,
    serverConfig.sshScanConcurrency,
    serverConfig.version
  );
  const healthService = new HealthService({
    dataFile: serverConfig.dataFile,
    version: serverConfig.version
  });
  const appLogsService = new AppLogsService(
    monitorOverviewService,
    sshTargetConfigStore,
    serverConfig.localDockerCommandTimeoutMs,
    serverConfig.sshCommandTimeoutMs
  );

  app.use(localAccessGuard());
  app.use(express.json({ limit: "1mb" }));
  app.use(
    "/api",
    createApiRouter({
      appLogsService,
      healthService,
      localDockerScanService,
      monitorOverviewService,
      sshScanService,
      sshTargetConfigService
    })
  );

  mountClientApp(app);

  return {
    app,
    localDockerScanService,
    monitorOverviewService,
    sshScanService
  } satisfies ServerAppContext;
};
