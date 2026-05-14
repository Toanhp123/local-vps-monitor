import { createServer } from "node:http";
import { createApp } from "./app";
import { serverConfig } from "./config";
import { OverviewWebSocketGateway } from "./realtime/overviewWebSocketGateway";

const { app, monitorService } = createApp();
const httpServer = createServer(app);

new OverviewWebSocketGateway(httpServer, monitorService, serverConfig.realtimeBroadcastMs);

httpServer.listen(serverConfig.port, () => {
  console.log(`VPS Monitor API listening on http://localhost:${serverConfig.port}`);
  console.log(`VPS Monitor WebSocket listening on ws://localhost:${serverConfig.port}/ws`);
});
