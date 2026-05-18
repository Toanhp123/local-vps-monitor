import { z } from "zod";

export const dataRetentionSettingsUpdateSchema = z
	.object({
		dataRetentionEnabled: z.boolean(),
		incidentsRetentionDays: z.number().int().min(1).max(365),
		metricsRetentionDays: z.number().int().min(1).max(365),
	})
	.strict();
