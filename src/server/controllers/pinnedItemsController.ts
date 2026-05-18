import type { RequestHandler } from "express";
import { apiError } from "../errors/apiError";
import type { PinnedItemsService } from "../services/pinnedItemsService";
import { pinnedItemsSchema } from "../validators/pinnedItemsSchema";

export class PinnedItemsController {
	constructor(private readonly pinnedItemsService: PinnedItemsService) {}

	getPinnedItems: RequestHandler = (_request, response) => {
		response.json({
			pinnedItems: this.pinnedItemsService.getPinnedItems(),
		});
	};

	replacePinnedItems: RequestHandler = (request, response) => {
		const parsed = pinnedItemsSchema.safeParse(request.body);
		if (!parsed.success) {
			throw apiError(400, "Invalid pinned items", {
				details: parsed.error.flatten(),
			});
		}

		const pinnedItems = this.pinnedItemsService.replacePinnedItems(
			parsed.data,
		);
		response.json({ pinnedItems });
	};
}
