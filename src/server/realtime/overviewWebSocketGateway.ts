import type { Server as HttpServer } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import type { RealtimeMessage } from "../../shared/types";
import type { MonitorOverviewService } from "../services/monitorOverviewService";

export class OverviewWebSocketGateway {
  private readonly wss: WebSocketServer;
  private readonly broadcastTimer: NodeJS.Timeout;
  private readonly unsubscribeOverview: () => void;

  constructor(
    httpServer: HttpServer,
    private readonly monitorOverviewService: MonitorOverviewService,
    broadcastIntervalMs: number
  ) {
    this.wss = new WebSocketServer({ server: httpServer, path: "/ws" });

    this.wss.on("connection", (socket) => {
      this.send(socket, {
        type: "overview.snapshot",
        payload: this.monitorOverviewService.getOverview()
      });
    });

    this.unsubscribeOverview = this.monitorOverviewService.onOverviewUpdated((overview) => {
      this.broadcast({
        type: "overview.updated",
        payload: overview
      });
    });

    this.broadcastTimer = setInterval(() => {
      this.broadcast({
        type: "overview.snapshot",
        payload: this.monitorOverviewService.getOverview()
      });
    }, broadcastIntervalMs);

    this.wss.on("close", () => {
      clearInterval(this.broadcastTimer);
      this.unsubscribeOverview();
    });
  }

  private broadcast(message: RealtimeMessage) {
    const payload = JSON.stringify(message);

    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  private send(socket: WebSocket, message: RealtimeMessage) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }
}
