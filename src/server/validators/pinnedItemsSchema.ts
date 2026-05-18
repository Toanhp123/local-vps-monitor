import { z } from "zod";

const pinnedIdSchema = z.string().trim().min(1).max(400);

export const pinnedItemsSchema = z
	.object({
		appGroupIdsByServerId: z.record(
			pinnedIdSchema,
			z.array(pinnedIdSchema).max(500),
		),
		serverIds: z.array(pinnedIdSchema).max(500),
	})
	.strict();
