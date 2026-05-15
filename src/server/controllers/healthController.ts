import type { RequestHandler } from "express";
import type { HealthService } from "../services/healthService";

export class HealthController {
	constructor(private readonly healthService: HealthService) {}

	getHealth: RequestHandler = (_request, response) => {
		response.json(this.healthService.getHealth());
	};
}
