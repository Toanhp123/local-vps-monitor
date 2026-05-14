import express, { type Express } from "express";
import fs from "node:fs";
import path from "node:path";
import { serverConfig } from "./config";
import { localAccessGuard } from "./middleware/localAccessGuard";
import { MonitorStateStore } from "./models/monitorStateStore";
import { SshTargetConfigStore } from "./models/sshTargetConfigStore";
import { createApiRouter } from "./routes/apiRoutes";
import { HealthService } from "./services/healthService";
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
  monitorOverviewService: MonitorOverviewService;
}

export const createApp = () => {
  const app = express();
  const monitorStateStore = new MonitorStateStore(serverConfig.dataFile);
  const sshTargetConfigStore = new SshTargetConfigStore(serverConfig.sshTargetsFile);
  const monitorOverviewService = new MonitorOverviewService(monitorStateStore, serverConfig.offlineAfterMs);
  const sshTargetConfigService = new SshTargetConfigService(sshTargetConfigStore);
  const sshScanService = new SshScanService(
    sshTargetConfigStore,
    monitorOverviewService,
    serverConfig.sshCommandTimeoutMs,
    serverConfig.version
  );
  const healthService = new HealthService({
    dataFile: serverConfig.dataFile,
    version: serverConfig.version
  });

  app.use(localAccessGuard(serverConfig.allowRemoteAccess));
  app.use(express.json({ limit: "1mb" }));
  app.use(
    "/api",
    createApiRouter({
      healthService,
      monitorOverviewService,
      sshScanService,
      sshTargetConfigService
    })
  );

  mountClientApp(app);

  return {
    app,
    monitorOverviewService
  } satisfies ServerAppContext;
};
