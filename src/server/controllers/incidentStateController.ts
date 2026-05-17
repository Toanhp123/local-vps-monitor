import type { RequestHandler } from "express";
import { apiError } from "../errors/apiError";
import type { IncidentStateService } from "../services/incidentStateService";
import { incidentStateSchema } from "../validators/incidentStateSchema";

export class IncidentStateController {
	constructor(private readonly incidentStateService: IncidentStateService) {}

	getState: RequestHandler = (_request, response) => {
		response.json({ state: this.incidentStateService.getState() });
	};

	replaceState: RequestHandler = (request, response) => {
		const parsed = incidentStateSchema.safeParse(request.body);
		if (!parsed.success) {
			throw apiError(400, "Invalid incident state", {
				details: parsed.error.flatten(),
			});
		}

		const state = this.incidentStateService.replaceState(parsed.data);
		response.json({ state });
	};
}
