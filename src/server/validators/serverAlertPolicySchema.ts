import { z } from "zod";

const percentSchema = z.number().min(1).max(99);
const cpuLoadPercentSchema = z.number().min(1).max(300);

const serverThresholdSchema = z
	.object({
		cpuLoadCriticalPercent: cpuLoadPercentSchema,
		cpuLoadWarningPercent: cpuLoadPercentSchema,
		diskCriticalPercent: percentSchema,
		diskWarningPercent: percentSchema,
		memoryCriticalPercent: percentSchema,
		memoryWarningPercent: percentSchema,
	})
	.strict()
	.refine(
		(value) => value.diskWarningPercent < value.diskCriticalPercent,
		{
			message: "Disk warning percent must be lower than critical percent",
			path: ["diskWarningPercent"],
		},
	)
	.refine(
		(value) => value.memoryWarningPercent < value.memoryCriticalPercent,
		{
			message: "Memory warning percent must be lower than critical percent",
			path: ["memoryWarningPercent"],
		},
	)
	.refine(
		(value) => value.cpuLoadWarningPercent < value.cpuLoadCriticalPercent,
		{
			message: "CPU load warning percent must be lower than critical percent",
			path: ["cpuLoadWarningPercent"],
		},
	);

export const serverAlertPolicyUpdateSchema = z
	.object({
		defaults: serverThresholdSchema,
		serverOverrides: z.record(z.string().trim().min(1), serverThresholdSchema),
	})
	.strict();
