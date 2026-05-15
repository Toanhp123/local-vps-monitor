import type { RequestHandler } from "express";
import { errorMessage } from "../lib/errorMessage";
import {
	isQuickActionId,
	QuickActionNotFoundError,
	type QuickActionService,
	QuickActionUnsupportedError,
} from "../services/quickActionService";

export class QuickActionsController {
	constructor(private readonly quickActionService: QuickActionService) {}

	runQuickAction: RequestHandler = async (request, response) => {
		const body = request.body as {
			actionId?: unknown;
			appId?: unknown;
			serverId?: unknown;
		};

		if (!isQuickActionId(body.actionId) || typeof body.serverId !== "string") {
			response.status(400).json({ error: "Invalid quick action request" });
			return;
		}

		if (
			body.appId !== undefined &&
			body.appId !== null &&
			typeof body.appId !== "string"
		) {
			response.status(400).json({ error: "Invalid app id" });
			return;
		}

		try {
			const result = await this.quickActionService.runQuickAction({
				actionId: body.actionId,
				appId: body.appId || undefined,
				serverId: body.serverId,
			});

			response.json({ result });
		} catch (error) {
			if (error instanceof QuickActionNotFoundError) {
				response.status(404).json({ error: error.message });
				return;
			}

			if (error instanceof QuickActionUnsupportedError) {
				response.status(400).json({ error: error.message });
				return;
			}

			response.status(502).json({
				error: "Cannot run quick action",
				message: errorMessage(error),
			});
		}
	};
}
