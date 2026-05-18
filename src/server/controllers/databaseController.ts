import type { RequestHandler } from "express";
import { apiError } from "../errors/apiError";
import type { DatabaseService } from "../services/databaseService";
import { dataRetentionSettingsUpdateSchema } from "../validators/databaseSettingsSchema";

export class DatabaseController {
	constructor(private readonly databaseService: DatabaseService) {}

	getStats: RequestHandler = (_request, response) => {
		const stats = this.databaseService.getStats();
		response.json({ stats });
	};

	getSettings: RequestHandler = (_request, response) => {
		response.json({ settings: this.databaseService.getRetentionSettings() });
	};

	updateSettings: RequestHandler = (request, response) => {
		const parsed = dataRetentionSettingsUpdateSchema.safeParse(request.body);
		if (!parsed.success) {
			throw apiError(400, "Invalid data retention settings", {
				details: parsed.error.flatten(),
			});
		}

		const settings = this.databaseService.updateRetentionSettings(parsed.data);
		response.json({ settings });
	};

	cleanupOldData: RequestHandler = (_request, response) => {
		const result = this.databaseService.cleanupOldData();
		response.json({ result });
	};

	vacuum: RequestHandler = (_request, response) => {
		this.databaseService.vacuum();
		response.json({ success: true });
	};
}
