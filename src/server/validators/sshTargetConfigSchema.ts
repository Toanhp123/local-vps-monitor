import { z } from "zod";

export const sshTargetConfigCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    host: z.string().trim().min(1).max(253),
    port: z.number().int().min(1).max(65_535),
    username: z.string().trim().min(1).max(64),
    privateKeyPath: z.string().trim().min(1).max(500),
    enabled: z.boolean().optional()
  })
  .strict();

export type SshTargetConfigCreateData = z.infer<typeof sshTargetConfigCreateSchema>;
