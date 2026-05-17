export type AppKind = "docker" | "pm2";

export type HealthStatus = "healthy" | "warning" | "down" | "unknown";

export type AppImportance = "critical" | "normal" | "ignored";

export type AppPolicyMatchMode = "contains" | "exact" | "regex";

export interface EffectiveAppPolicy {
  displayName?: string;
  importance: AppImportance;
  policyId?: string;
  ruleId?: string;
}

export interface DiskMetrics {
  availableBytes: number;
  filesystem: string;
  mount: string;
  totalBytes: number;
  usedBytes: number;
  usedPercent: number;
}

export interface HostMetrics {
  hostname: string;
  platform: string;
  arch: string;
  uptimeSeconds: number;
  loadAverage: number[];
  cpuCount: number;
  memoryTotalBytes: number;
  memoryFreeBytes: number;
  disk?: DiskMetrics;
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
  monitoring?: EffectiveAppPolicy;
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
  diskTotalBytes?: number;
  diskUsedBytes?: number;
  diskUsedPercent?: number;
  memoryUsedBytes: number;
  memoryTotalBytes: number;
  restartCount: number;
}

export type IncidentSeverity = "info" | "warning" | "critical" | "resolved";

export type IncidentKind =
  | "app-added"
  | "app-health"
  | "app-removed"
  | "app-restart"
  | "cpu-load"
  | "disk-usage"
  | "http-check"
  | "memory-usage";

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

export interface IncidentSnoozeState {
	incidentId: string;
	snoozedUntil: number;
}

export interface IncidentStateSnapshot {
	acknowledgedIncidentIds: string[];
	readIncidentIds: string[];
	snoozedIncidents: IncidentSnoozeState[];
}

export interface IncidentStateResponse {
	state: IncidentStateSnapshot;
}

export interface ServerAlertThresholds {
	cpuLoadCriticalPercent: number;
	cpuLoadWarningPercent: number;
	diskCriticalPercent: number;
	diskWarningPercent: number;
	memoryCriticalPercent: number;
	memoryWarningPercent: number;
}

export interface ServerAlertPolicy {
	defaults: ServerAlertThresholds;
	serverOverrides: Record<string, ServerAlertThresholds>;
}

export interface ServerAlertPolicyResponse {
	policy: ServerAlertPolicy;
}

export type ServerAlertPolicyUpdateInput = ServerAlertPolicy;

export interface MonitorRuntimeSettings {
	autoScanIntervalMs: number;
	defaultAppLogLines: number;
	httpCheckConcurrency: number;
	incidentHistoryLimit: number;
	localDockerCommandTimeoutMs: number;
	metricHistoryLimit: number;
	offlineAfterMs: number;
	realtimeBroadcastMs: number;
	sshCommandTimeoutMs: number;
	sshScanConcurrency: number;
}

export interface MonitorRuntimeSettingsResponse {
	settings: MonitorRuntimeSettings;
}

export type MonitorRuntimeSettingsUpdateInput = MonitorRuntimeSettings;

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
  monitoredApps: number;
  ignoredApps: number;
  criticalApps: number;
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

export interface SshTargetBootstrapInput {
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  enabled?: boolean;
}

export interface SshTargetUpdateInput {
  name?: string;
  host?: string;
  port?: number;
  username?: string;
  privateKeyPath?: string;
  enabled?: boolean;
}

export interface SshTargetListResponse {
  targets: SshTarget[];
}

export type SshTargetBulkImportInput =
  | {
      authMode: "key";
      targets: SshTargetCreateInput[];
    }
  | {
      authMode: "password";
      targets: SshTargetBootstrapInput[];
    };

export interface SshTargetBulkImportResponse {
  targets: SshTarget[];
  errors: Array<{
    host?: string;
    index: number;
    message: string;
    name?: string;
  }>;
}

export interface SshTargetTestResponse {
  checkedAt: string;
  message: string;
  ok: boolean;
  targetId: string;
}

export type HttpCheckMethod = "GET" | "HEAD";
export type HttpCheckStatus = "healthy" | "warning" | "down" | "unknown";

export interface HttpCheckResult {
  checkedAt: string;
  error?: string;
  latencyMs?: number;
  status: HttpCheckStatus;
  statusCode?: number;
}

export interface HttpCheck {
  id: string;
  appId?: string;
  createdAt: string;
  enabled: boolean;
  expectedStatusMax: number;
  expectedStatusMin: number;
  lastResult?: HttpCheckResult;
  method: HttpCheckMethod;
  name: string;
  serverId?: string;
  timeoutMs: number;
  updatedAt: string;
  url: string;
}

export interface HttpCheckCreateInput {
  appId?: string;
  enabled?: boolean;
  expectedStatusMax?: number;
  expectedStatusMin?: number;
  method?: HttpCheckMethod;
  name: string;
  serverId?: string;
  timeoutMs?: number;
  url: string;
}

export interface HttpCheckUpdateInput {
  appId?: string;
  enabled?: boolean;
  expectedStatusMax?: number;
  expectedStatusMin?: number;
  method?: HttpCheckMethod;
  name?: string;
  serverId?: string;
  timeoutMs?: number;
  url?: string;
}

export interface HttpCheckListResponse {
  checks: HttpCheck[];
}

export interface HttpCheckRunResponse {
  check: HttpCheck;
}

export interface HttpCheckRunAllResponse {
  results: HttpCheck[];
  errors: Array<{
    checkId: string;
    message: string;
  }>;
}

export interface AppPolicy {
  id: string;
  appId?: string;
  appKind?: AppKind;
  createdAt: string;
  displayName?: string;
  enabled: boolean;
  importance: AppImportance;
  match?: string;
  matchMode?: AppPolicyMatchMode;
  name: string;
  serverId?: string;
  updatedAt: string;
}

export interface AppPolicyCreateInput {
  appKind?: AppKind;
  displayName?: string;
  enabled?: boolean;
  importance: AppImportance;
  match: string;
  matchMode?: AppPolicyMatchMode;
  name: string;
  serverId?: string;
}

export interface AppPolicyUpdateInput {
  appKind?: AppKind;
  displayName?: string;
  enabled?: boolean;
  importance?: AppImportance;
  match?: string;
  matchMode?: AppPolicyMatchMode;
  name?: string;
  serverId?: string;
}

export interface AppPolicyOverrideInput {
  appId: string;
  appKind: AppKind;
  appName: string;
  displayName?: string;
  importance: AppImportance;
  serverId: string;
}

export interface AppPolicyListResponse {
  policies?: AppPolicy[];
  rules?: AppPolicy[];
}

export interface AppPolicyResponse {
  policy?: AppPolicy | null;
  rule?: AppPolicy | null;
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
  | "docker.start"
  | "docker.stop"
  | "pm2.restart"
  | "pm2.start"
  | "pm2.stop"
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
