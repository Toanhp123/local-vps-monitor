import type { RequestHandler } from "express";
import type { MonitorOverviewService } from "../services/monitorOverviewService";
import { heartbeatSchema } from "../validators/heartbeatSchema";

export class HeartbeatController {
  constructor(
    private readonly monitorOverviewService: MonitorOverviewService,
    private readonly ingestToken: string
  ) {}

  ingestHeartbeat: RequestHandler = (request, response) => {
    const token = request.header("authorization")?.replace(/^Bearer\s+/i, "");

    if (!token || token !== this.ingestToken) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parsed = heartbeatSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: "Invalid heartbeat payload", details: parsed.error.flatten() });
      return;
    }

    const server = this.monitorOverviewService.ingestHeartbeat(parsed.data);
    response.json({ ok: true, serverId: server.serverId, lastSeenAt: server.lastSeenAt });
  };
}
