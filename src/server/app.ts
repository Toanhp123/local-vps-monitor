import express, { type Express } from "express";
import fs from "node:fs";
import path from "node:path";
import { serverConfig } from "./config";
import { MonitorStore } from "./models/monitorStore";
import { createApiRouter } from "./routes/apiRoutes";
import { HealthService } from "./services/healthService";
import { MonitorService } from "./services/monitorService";

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
  monitorService: MonitorService;
}

export const createApp = () => {
  const app = express();
  const store = new MonitorStore(serverConfig.dataFile, serverConfig.offlineAfterMs);
  const monitorService = new MonitorService(store);
  const healthService = new HealthService({
    dataFile: serverConfig.dataFile,
    version: serverConfig.version
  });

  app.use(express.json({ limit: "1mb" }));
  app.use(
    "/api",
    createApiRouter({
      healthService,
      ingestToken: serverConfig.ingestToken,
      monitorService
    })
  );

  mountClientApp(app);

  return {
    app,
    monitorService
  } satisfies ServerAppContext;
};
