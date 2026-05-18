import { Router } from "express";
import { PinnedItemsController } from "../controllers/pinnedItemsController";
import type { PinnedItemsService } from "../services/pinnedItemsService";

export const createPinnedItemsRouter = (
	pinnedItemsService: PinnedItemsService,
) => {
	const router = Router();
	const pinnedItemsController = new PinnedItemsController(
		pinnedItemsService,
	);

	router.get("/pinned-items", pinnedItemsController.getPinnedItems);
	router.put("/pinned-items", pinnedItemsController.replacePinnedItems);

	return router;
};
