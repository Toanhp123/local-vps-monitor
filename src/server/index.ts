import { createServer } from "node:http";
import { createApp } from "./app";
import { serverConfig } from "./config";
import { OverviewWebSocketGateway } from "./realtime/overviewWebSocketGateway";
import { AutoScanScheduler } from "./services/autoScanScheduler";

const { app, monitorOverviewService, sshScanService } = createApp();
const httpServer = createServer(app);
const autoScanScheduler = new AutoScanScheduler(sshScanService, serverConfig.autoScanIntervalMs);

new OverviewWebSocketGateway(httpServer, monitorOverviewService, serverConfig.realtimeBroadcastMs);

httpServer.listen(serverConfig.port, serverConfig.host, () => {
  console.log(`VPS Monitor API listening on http://${serverConfig.host}:${serverConfig.port}`);
  console.log(`VPS Monitor WebSocket listening on ws://${serverConfig.host}:${serverConfig.port}/ws`);

  if (serverConfig.autoScanIntervalMs > 0) {
    console.log(`VPS Monitor auto scan interval: ${serverConfig.autoScanIntervalMs}ms`);
    autoScanScheduler.start();
  }
});

const shutdown = () => {
  autoScanScheduler.stop();
  httpServer.close(() => {
    process.exit(0);
  });
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
