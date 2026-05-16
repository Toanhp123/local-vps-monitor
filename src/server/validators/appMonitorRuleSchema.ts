import { z } from "zod";

const appKindSchema = z.enum(["docker", "pm2"]);
const appImportanceSchema = z.enum(["critical", "normal", "ignored"]);
const appMonitorRuleMatchModeSchema = z.enum(["contains", "exact", "regex"]);

const optionalTrimmedText = (max: number) =>
	z
		.string()
		.trim()
		.max(max)
		.optional()
		.transform((value) => value || undefined);

export const appMonitorRuleCreateSchema = z
	.object({
		appKind: appKindSchema.optional(),
		displayName: optionalTrimmedText(120),
		enabled: z.boolean().optional(),
		importance: appImportanceSchema,
		match: z.string().trim().min(1).max(200),
		matchMode: appMonitorRuleMatchModeSchema.optional(),
		name: z.string().trim().min(1).max(100),
		serverId: optionalTrimmedText(200),
	})
	.strict();

export const appMonitorRuleUpdateSchema = z
	.object({
		appKind: appKindSchema.optional(),
		displayName: optionalTrimmedText(120),
		enabled: z.boolean().optional(),
		importance: appImportanceSchema.optional(),
		match: z.string().trim().min(1).max(200).optional(),
		matchMode: appMonitorRuleMatchModeSchema.optional(),
		name: z.string().trim().min(1).max(100).optional(),
		serverId: optionalTrimmedText(200),
	})
	.strict()
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one field is required",
	});

export const appMonitorAppOverrideSchema = z
	.object({
		appId: z.string().trim().min(1).max(200),
		appKind: appKindSchema,
		appName: z.string().trim().min(1).max(200),
		displayName: optionalTrimmedText(120),
		importance: appImportanceSchema,
		serverId: z.string().trim().min(1).max(200),
	})
	.strict();
