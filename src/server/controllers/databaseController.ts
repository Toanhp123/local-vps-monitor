import type { RequestHandler } from "express";
import { apiError } from "../errors/apiError";
import type { DatabaseService } from "../services/databaseService";
import {
	dataRetentionSettingsUpdateSchema,
	serverMetricHistoryQuerySchema,
} from "../validators/databaseSettingsSchema";

export class DatabaseController {
	constructor(private readonly databaseService: DatabaseService) {}

	getStats: RequestHandler = (_request, response) => {
		const stats = this.databaseService.getStats();
		response.json({ stats });
	};

	getSettings: RequestHandler = (_request, response) => {
		response.json({ settings: this.databaseService.getRetentionSettings() });
	};

	getServerMetricHistory: RequestHandler = (request, response) => {
		const serverId = request.params.serverId;
		if (typeof serverId !== "string" || serverId.length === 0) {
			throw apiError(400, "Missing server id");
		}

		const parsed = serverMetricHistoryQuerySchema.safeParse(request.query);
		if (!parsed.success) {
			throw apiError(400, "Invalid metric history query", {
				details: parsed.error.flatten(),
			});
		}

		const range = parsed.data.range ?? "24h";
		const metrics = this.databaseService.getServerMetricHistory(
			serverId,
			range,
		);
		response.json({ metrics, range, serverId });
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
