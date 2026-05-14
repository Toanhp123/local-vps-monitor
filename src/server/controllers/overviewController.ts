import type { RequestHandler } from "express";
import type { MonitorService } from "../services/monitorService";

export class OverviewController {
  constructor(private readonly monitorService: MonitorService) {}

  getOverview: RequestHandler = (_request, response) => {
    response.json(this.monitorService.getOverview());
  };
}
