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

export type AppGroupSource = "docker-compose" | "docker" | "pm2";

export interface AppGroup {
  id: string;
  name: string;
  source: AppGroupSource;
}

export interface AppSnapshot {
  id: string;
  name: string;
  kind: AppKind;
  status: string;
  health: HealthStatus;
  group?: AppGroup;
  cpuPercent?: number;
  memoryBytes?: number;
  image?: string;
  ports?: string;
  restarts?: number;
  uptimeSeconds?: number;
  raw?: Record<string, unknown>;
}

export interface ServerSnapshotPayload {
  serverId: string;
  serverName: string;
  collectorVersion: string;
  observedAt: string;
  host: HostMetrics;
  apps: AppSnapshot[];
}

export interface ServerMetricPoint {
  observedAt: string;
  appCpuPercent: number;
  memoryUsedBytes: number;
  memoryTotalBytes: number;
  restartCount: number;
}

export type IncidentSeverity = "info" | "warning" | "critical" | "resolved";

export type IncidentKind =
  | "app-added"
  | "app-health"
  | "app-removed"
  | "app-restart";

export interface IncidentEvent {
  id: string;
  appId?: string;
  appName?: string;
  currentHealth?: HealthStatus;
  currentValue?: number;
  kind: IncidentKind;
  message: string;
  occurredAt: string;
  previousHealth?: HealthStatus;
  previousValue?: number;
  serverId: string;
  serverName: string;
  severity: IncidentSeverity;
  title: string;
}

export interface StoredServer extends ServerSnapshotPayload {
  lastSeenAt: string;
  metricsHistory: ServerMetricPoint[];
  incidents: IncidentEvent[];
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

export interface SshTarget {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  privateKeyPath: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SshTargetCreateInput {
  name: string;
  host: string;
  port: number;
  username: string;
  privateKeyPath: string;
  enabled?: boolean;
}

export interface SshTargetListResponse {
  targets: SshTarget[];
}

export interface ScanResult {
  targetId: string;
  serverId: string;
  serverName: string;
  appCount: number;
  scannedAt: string;
}

export type SshScanResult = ScanResult;

export interface SshScanAllResponse {
  results: ScanResult[];
  errors: Array<{
    targetId: string;
    message: string;
  }>;
}

export interface AppLogsResponse {
  appId: string;
  appName: string;
  content: string;
  fetchedAt: string;
  kind: AppKind;
  lines: number;
  serverId: string;
}

export type QuickActionId =
  | "docker.restart"
  | "pm2.restart"
  | "server.disk"
  | "server.memory"
  | "server.ports"
  | "server.uptime";

export interface QuickActionRunInput {
  actionId: QuickActionId;
  appId?: string;
  serverId: string;
}

export interface QuickActionRunResponse {
  actionId: QuickActionId;
  appId?: string;
  commandLabel: string;
  commandPreview: string;
  exitCode?: number;
  ok: boolean;
  ranAt: string;
  serverId: string;
  stderr: string;
  stdout: string;
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
