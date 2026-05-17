import type { RequestHandler } from "express";
import { apiError } from "../errors/apiError";
import { withApiErrorFallback } from "../errors/apiErrorMapping";
import { paramString } from "../lib/httpParams";
import type { AppLogsService } from "../services/appLogsService";

const parseLines = (value: unknown) => {
	if (typeof value !== "string") return undefined;

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
};

export class AppLogsController {
	constructor(private readonly appLogsService: AppLogsService) {}

	getAppLogs: RequestHandler = async (request, response) => {
		const serverId = paramString(request.params.serverId);
		const appId = paramString(request.params.appId);

		if (!serverId || !appId) {
			throw apiError(400, "Missing server or app id");
		}

		try {
			const logs = await this.appLogsService.getAppLogs({
				appId,
				lines: parseLines(request.query.lines),
				serverId,
			});

			response.json({ logs });
		} catch (error) {
			throw withApiErrorFallback(error, {
				error: "Cannot read app logs",
				statusCode: 502,
			});
		}
	};
}
