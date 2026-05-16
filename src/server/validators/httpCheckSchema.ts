import { z } from "zod";

const httpCheckMethodSchema = z.enum(["GET", "HEAD"]);

const httpCheckUrlSchema = z
	.string()
	.trim()
	.min(1)
	.max(2_000)
	.url()
	.refine((value) => {
		try {
			const url = new URL(value);
			return url.protocol === "http:" || url.protocol === "https:";
		} catch {
			return false;
		}
	}, "URL must use http or https");

export const httpCheckCreateSchema = z
	.object({
		appId: z.string().trim().max(200).optional(),
		enabled: z.boolean().optional(),
		expectedStatusMax: z.number().int().min(100).max(599).optional(),
		expectedStatusMin: z.number().int().min(100).max(599).optional(),
		method: httpCheckMethodSchema.optional(),
		name: z.string().trim().min(1).max(100),
		serverId: z.string().trim().max(200).optional(),
		timeoutMs: z.number().int().min(500).max(60_000).optional(),
		url: httpCheckUrlSchema,
	})
	.strict()
	.refine(
		(value) =>
			(value.expectedStatusMin ?? 200) <=
			(value.expectedStatusMax ?? 399),
		{
			message: "Expected status min must be lower than max",
			path: ["expectedStatusMin"],
		},
	);

export const httpCheckUpdateSchema = z
	.object({
		appId: z.string().trim().max(200).optional(),
		enabled: z.boolean().optional(),
		expectedStatusMax: z.number().int().min(100).max(599).optional(),
		expectedStatusMin: z.number().int().min(100).max(599).optional(),
		method: httpCheckMethodSchema.optional(),
		name: z.string().trim().min(1).max(100).optional(),
		serverId: z.string().trim().max(200).optional(),
		timeoutMs: z.number().int().min(500).max(60_000).optional(),
		url: httpCheckUrlSchema.optional(),
	})
	.strict()
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one field is required",
	})
	.refine(
		(value) =>
			value.expectedStatusMin === undefined ||
			value.expectedStatusMax === undefined ||
			value.expectedStatusMin <= value.expectedStatusMax,
		{
			message: "Expected status min must be lower than max",
			path: ["expectedStatusMin"],
		},
	);
