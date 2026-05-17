import { z } from "zod";

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
		sshCommandTimeoutMs: z.number().int().min(1_000).max(120_000),
		sshScanConcurrency: z.number().int().min(1).max(32),
	})
	.strict();
