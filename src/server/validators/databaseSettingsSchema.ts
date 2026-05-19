import { z } from "zod";

export const serverMetricHistoryQuerySchema = z.object({
	range: z.enum(["1h", "24h", "7d", "30d"]).optional(),
});

export const dataRetentionSettingsUpdateSchema = z
	.object({
		dataRetentionEnabled: z.boolean(),
		incidentsRetentionDays: z.number().int().min(1).max(365),
		metricsRetentionDays: z.number().int().min(1).max(365),
	})
	.strict();
