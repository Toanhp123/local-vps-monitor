import type { RequestHandler } from "express";
import { apiError } from "../errors/apiError";
import type { MonitorRuntimeService } from "../services/monitorRuntimeService";
import { monitorRuntimeUpdateSchema } from "../validators/monitorRuntimeSchema";

export class MonitorRuntimeController {
	constructor(private readonly monitorRuntimeService: MonitorRuntimeService) {}

	getSettings: RequestHandler = (_request, response) => {
		response.json({ settings: this.monitorRuntimeService.getSettings() });
	};

	updateSettings: RequestHandler = (request, response) => {
		const parsed = monitorRuntimeUpdateSchema.safeParse(request.body);
		if (!parsed.success) {
			throw apiError(400, "Invalid monitor runtime settings", {
				details: parsed.error.flatten(),
			});
		}

		const settings = this.monitorRuntimeService.updateSettings(parsed.data);
		response.json({ settings });
	};
}
