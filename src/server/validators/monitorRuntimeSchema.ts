import { z } from "zod";

const serverMonitorRuntimeOverrideSchema = z
	.object({
		autoScanIntervalMs: z.number().int().min(0).max(3_600_000).optional(),
		defaultAppLogLines: z.number().int().min(10).max(1_000).optional(),
		localDockerCommandTimeoutMs: z
			.number()
			.int()
			.min(1_000)
			.max(120_000)
			.optional(),
		offlineAfterMs: z.number().int().min(5_000).max(3_600_000).optional(),
		sshCommandTimeoutMs: z
			.number()
			.int()
			.min(1_000)
			.max(120_000)
			.optional(),
	})
	.strict();

export const monitorRuntimeUpdateSchema = z
	.object({
		autoScanIntervalMs: z.number().int().min(0).max(3_600_000),
		defaultAppLogLines: z.number().int().min(10).max(1_000),
		httpCheckConcurrency: z.number().int().min(1).max(32),
		incidentHistoryLimit: z.number().int().min(10).max(1_000),
		localDockerCommandTimeoutMs: z.number().int().min(1_000).max(120_000),
		metricHistoryLimit: z.number().int().min(10).max(1_440),
		offlineAfterMs: z.number().int().min(5_000).max(3_600_000),
		realtimeBroadcastMs: z.number().int().min(1_000).max(60_000),
		serverOverrides: z
			.record(z.string(), serverMonitorRuntimeOverrideSchema)
			.default({}),
		sshCommandTimeoutMs: z.number().int().min(1_000).max(120_000),
		sshScanConcurrency: z.number().int().min(1).max(32),
	})
	.strict()
	.refine(
		(data) => data.offlineAfterMs >= data.autoScanIntervalMs * 1.5,
		{
			message:
				"Offline timeout must be at least 1.5x the auto scan interval to prevent false offline detection",
			path: ["offlineAfterMs"],
		},
	);
