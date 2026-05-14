import { z } from "zod";

export const heartbeatSchema = z.object({
  serverId: z.string().min(1),
  serverName: z.string().min(1),
  agentVersion: z.string().min(1),
  observedAt: z.string().datetime(),
  host: z.object({
    hostname: z.string().min(1),
    platform: z.string().min(1),
    arch: z.string().min(1),
    uptimeSeconds: z.number().nonnegative(),
    loadAverage: z.array(z.number()),
    cpuCount: z.number().int().positive(),
    memoryTotalBytes: z.number().nonnegative(),
    memoryFreeBytes: z.number().nonnegative()
  }),
  apps: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      kind: z.enum(["docker", "pm2"]),
      status: z.string().min(1),
      health: z.enum(["healthy", "warning", "down", "unknown"]),
      cpuPercent: z.number().nonnegative().optional(),
      memoryBytes: z.number().nonnegative().optional(),
      image: z.string().optional(),
      ports: z.string().optional(),
      restarts: z.number().int().nonnegative().optional(),
      uptimeSeconds: z.number().nonnegative().optional(),
      raw: z.record(z.string(), z.unknown()).optional()
    })
  )
});
