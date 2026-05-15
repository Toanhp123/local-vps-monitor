import type { RequestHandler } from "express";
import type { MonitorOverviewService } from "../services/monitorOverviewService";

export class OverviewController {
	constructor(
		private readonly monitorOverviewService: MonitorOverviewService,
	) {}

	getOverview: RequestHandler = (_request, response) => {
		response.json(this.monitorOverviewService.getOverview());
	};
}
