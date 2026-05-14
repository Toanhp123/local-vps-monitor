export type AppKind = "docker" | "pm2";

export type HealthStatus = "healthy" | "warning" | "down" | "unknown";

export interface HostMetrics {
  hostname: string;
  platform: string;
  arch: string;
  uptimeSeconds: number;
  loadAverage: number[];
  cpuCount: number;
  memoryTotalBytes: number;
  memoryFreeBytes: number;
}

export interface AppSnapshot {
  id: string;
  name: string;
  kind: AppKind;
  status: string;
  health: HealthStatus;
  cpuPercent?: number;
  memoryBytes?: number;
  image?: string;
  ports?: string;
  restarts?: number;
  uptimeSeconds?: number;
  raw?: Record<string, unknown>;
}

export interface HeartbeatPayload {
  serverId: string;
  serverName: string;
  agentVersion: string;
  observedAt: string;
  host: HostMetrics;
  apps: AppSnapshot[];
}

export interface StoredServer extends HeartbeatPayload {
  lastSeenAt: string;
  online: boolean;
  status: HealthStatus;
}

export interface OverviewSummary {
  totalServers: number;
  onlineServers: number;
  totalApps: number;
  healthyApps: number;
  warningApps: number;
  downApps: number;
  unknownApps: number;
}

export interface OverviewResponse {
  generatedAt: string;
  summary: OverviewSummary;
  servers: StoredServer[];
}

export type RealtimeMessage =
  | {
      type: "overview.snapshot";
      payload: OverviewResponse;
    }
  | {
      type: "overview.updated";
      payload: OverviewResponse;
    };
