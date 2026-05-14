import { createServer } from "node:http";
import { createApp } from "./app";
import { serverConfig } from "./config";
import { OverviewWebSocketGateway } from "./realtime/overviewWebSocketGateway";

const { app, monitorOverviewService } = createApp();
const httpServer = createServer(app);

new OverviewWebSocketGateway(httpServer, monitorOverviewService, serverConfig.realtimeBroadcastMs);

httpServer.listen(serverConfig.port, serverConfig.host, () => {
  console.log(`VPS Monitor API listening on http://${serverConfig.host}:${serverConfig.port}`);
  console.log(`VPS Monitor WebSocket listening on ws://${serverConfig.host}:${serverConfig.port}/ws`);
});
