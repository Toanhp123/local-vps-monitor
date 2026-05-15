import type { RequestHandler } from "express";
import { errorMessage } from "../lib/errorMessage";
import {
	AppLogsNotFoundError,
	type AppLogsService,
	AppLogsUnsupportedError,
} from "../services/appLogsService";

const paramString = (value: string | string[] | undefined) => {
	return Array.isArray(value) ? value[0] : value;
};

const parseLines = (value: unknown) => {
	if (typeof value !== "string") return 200;

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 200;
};

export class AppLogsController {
	constructor(private readonly appLogsService: AppLogsService) {}

	getAppLogs: RequestHandler = async (request, response) => {
		const serverId = paramString(request.params.serverId);
		const appId = paramString(request.params.appId);

		if (!serverId || !appId) {
			response.status(400).json({ error: "Missing server or app id" });
			return;
		}

		try {
			const logs = await this.appLogsService.getAppLogs({
				appId,
				lines: parseLines(request.query.lines),
				serverId,
			});

			response.json({ logs });
		} catch (error) {
			if (error instanceof AppLogsNotFoundError) {
				response.status(404).json({ error: "Logs target not found" });
				return;
			}

			if (error instanceof AppLogsUnsupportedError) {
				response.status(400).json({
					error: "Logs are not supported for this app",
					message: error.message,
				});
				return;
			}

			response.status(502).json({
				error: "Cannot read app logs",
				message: errorMessage(error),
			});
		}
	};
}
