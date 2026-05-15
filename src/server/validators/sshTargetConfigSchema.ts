import { z } from "zod";

export const sshTargetConfigCreateSchema = z
	.object({
		name: z.string().trim().min(1).max(80),
		host: z
			.string()
			.trim()
			.min(1)
			.max(253)
			.refine((value) => !/\s/.test(value), {
				message: "Host must not contain whitespace",
			}),
		port: z.number().int().min(1).max(65_535),
		username: z.string().trim().min(1).max(64),
		privateKeyPath: z.string().trim().min(1).max(500),
		enabled: z.boolean().optional(),
	})
	.strict();

export const sshTargetConfigUpdateSchema = z
	.object({
		name: z.string().trim().min(1).max(80).optional(),
		host: z
			.string()
			.trim()
			.min(1)
			.max(253)
			.refine((value) => !/\s/.test(value), {
				message: "Host must not contain whitespace",
			})
			.optional(),
		port: z.number().int().min(1).max(65_535).optional(),
		username: z.string().trim().min(1).max(64).optional(),
		privateKeyPath: z.string().trim().min(1).max(500).optional(),
		enabled: z.boolean().optional(),
	})
	.strict()
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one field is required",
	});

export const sshTargetBootstrapSchema = z
	.object({
		name: z.string().trim().min(1).max(80),
		host: z
			.string()
			.trim()
			.min(1)
			.max(253)
			.refine((value) => !/\s/.test(value), {
				message: "Host must not contain whitespace",
			}),
		port: z.number().int().min(1).max(65_535),
		username: z.string().trim().min(1).max(64),
		password: z.string().min(1).max(500),
		enabled: z.boolean().optional(),
	})
	.strict();

export const sshTargetBulkImportSchema = z.discriminatedUnion("authMode", [
	z
		.object({
			authMode: z.literal("key"),
			targets: z.array(sshTargetConfigCreateSchema).min(1).max(500),
		})
		.strict(),
	z
		.object({
			authMode: z.literal("password"),
			targets: z.array(sshTargetBootstrapSchema).min(1).max(500),
		})
		.strict(),
]);

export type SshTargetConfigCreateData = z.infer<
	typeof sshTargetConfigCreateSchema
>;
export type SshTargetBootstrapData = z.infer<typeof sshTargetBootstrapSchema>;
export type SshTargetConfigUpdateData = z.infer<
	typeof sshTargetConfigUpdateSchema
>;
export type SshTargetBulkImportData = z.infer<typeof sshTargetBulkImportSchema>;
