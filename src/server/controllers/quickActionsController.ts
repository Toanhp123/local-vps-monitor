import type { RequestHandler } from "express";
import { apiError } from "../errors/apiError";
import { withApiErrorFallback } from "../errors/apiErrorMapping";
import {
	isQuickActionId,
	type QuickActionService,
} from "../services/quickActionService";

export class QuickActionsController {
	constructor(private readonly quickActionService: QuickActionService) {}

	runQuickAction: RequestHandler = async (request, response) => {
		const body = request.body as {
			actionId?: unknown;
			appId?: unknown;
			serverId?: unknown;
		};

		if (
			!isQuickActionId(body.actionId) ||
			typeof body.serverId !== "string"
		) {
			throw apiError(400, "Invalid quick action request");
		}

		if (
			body.appId !== undefined &&
			body.appId !== null &&
			typeof body.appId !== "string"
		) {
			throw apiError(400, "Invalid app id");
		}

		try {
			const result = await this.quickActionService.runQuickAction({
				actionId: body.actionId,
				appId: body.appId || undefined,
				serverId: body.serverId,
			});

			response.json({ result });
		} catch (error) {
			throw withApiErrorFallback(error, {
				error: "Cannot run quick action",
				statusCode: 502,
			});
		}
	};
}
