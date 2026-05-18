import type { DatabaseStore } from "../stores/databaseStore";
import { MetricsRepository } from "../stores/database/metricsRepository";
import { IncidentsRepository } from "../stores/database/incidentsRepository";
import type {
	DataRetentionSettings,
	DataRetentionSettingsUpdateInput,
	IncidentEvent,
	ServerMetricPoint,
	ServerSnapshotPayload,
	StoredServer,
} from "@shared/types";

export type DatabaseServiceConfig = DataRetentionSettings;

const metricsRetentionKey = "retention.metricsRetentionDays";
const incidentsRetentionKey = "retention.incidentsRetentionDays";
const dataRetentionEnabledKey = "retention.dataRetentionEnabled";

const clampDays = (value: unknown, fallback: number) => {
	if (typeof value !== "number" || !Number.isFinite(value)) return fallback;

	return Math.min(365, Math.max(1, Math.round(value)));
};

const normalizeRetentionSettings = (
	input: Partial<DataRetentionSettings>,
	fallback: DataRetentionSettings,
): DataRetentionSettings => ({
	dataRetentionEnabled:
		typeof input.dataRetentionEnabled === "boolean"
			? input.dataRetentionEnabled
			: fallback.dataRetentionEnabled,
	incidentsRetentionDays: clampDays(
		input.incidentsRetentionDays,
		fallback.incidentsRetentionDays,
	),
	metricsRetentionDays: clampDays(
		input.metricsRetentionDays,
		fallback.metricsRetentionDays,
	),
});

export class DatabaseService {
	private metricsRepo: MetricsRepository;
	private incidentsRepo: IncidentsRepository;
	private cleanupTimer: NodeJS.Timeout | null = null;
	private initialCleanupTimer: NodeJS.Timeout | null = null;
	private settings: DataRetentionSettings;

	constructor(
		private readonly databaseStore: DatabaseStore,
		defaultSettings: DatabaseServiceConfig,
	) {
		const db = this.databaseStore.getDatabase();
		this.metricsRepo = new MetricsRepository(db);
		this.incidentsRepo = new IncidentsRepository(db);
		this.settings = this.loadRetentionSettings(defaultSettings);

		this.syncAutoCleanup();
	}

	// Metrics
	public addServerMetric(
		serverId: string,
		serverName: string,
		observedAt: string,
		metrics: {
			cpuCount?: number;
			loadAverage?: number[];
			memoryTotalBytes?: number;
			memoryUsedBytes?: number;
			memoryFreeBytes?: number;
			diskTotalBytes?: number;
			diskUsedBytes?: number;
			diskUsedPercent?: number;
			diskFilesystem?: string;
			diskMount?: string;
			appCpuPercent?: number;
			appCount?: number;
			restartCount?: number;
		},
	): void {
		this.metricsRepo.insert({
			server_id: serverId,
			server_name: serverName,
			observed_at: observedAt,
			cpu_count: metrics.cpuCount ?? null,
			load_average_1m: metrics.loadAverage?.[0] ?? null,
			load_average_5m: metrics.loadAverage?.[1] ?? null,
			load_average_15m: metrics.loadAverage?.[2] ?? null,
			memory_total_bytes: metrics.memoryTotalBytes ?? null,
			memory_used_bytes: metrics.memoryUsedBytes ?? null,
			memory_free_bytes: metrics.memoryFreeBytes ?? null,
			disk_total_bytes: metrics.diskTotalBytes ?? null,
			disk_used_bytes: metrics.diskUsedBytes ?? null,
			disk_used_percent: metrics.diskUsedPercent ?? null,
			disk_filesystem: metrics.diskFilesystem ?? null,
			disk_mount: metrics.diskMount ?? null,
			app_cpu_percent: metrics.appCpuPercent ?? null,
			app_count: metrics.appCount ?? null,
			restart_count: metrics.restartCount ?? null,
		});
	}

	public recordServerMetric(
		server: StoredServer,
		payload: ServerSnapshotPayload,
		metric: ServerMetricPoint,
	): void {
		const disk = payload.host.disk;

		this.addServerMetric(server.serverId, server.serverName, metric.observedAt, {
			appCount: server.apps.length,
			appCpuPercent: metric.appCpuPercent,
			cpuCount: payload.host.cpuCount,
			diskFilesystem: disk?.filesystem,
			diskMount: disk?.mount,
			diskTotalBytes: metric.diskTotalBytes,
			diskUsedBytes: metric.diskUsedBytes,
			diskUsedPercent: metric.diskUsedPercent,
			loadAverage: payload.host.loadAverage,
			memoryFreeBytes: payload.host.memoryFreeBytes,
			memoryTotalBytes: metric.memoryTotalBytes,
			memoryUsedBytes: metric.memoryUsedBytes,
			restartCount: metric.restartCount,
		});
	}

	public flushMetrics(): void {
		this.metricsRepo.flush();
	}

	public getServerMetrics(serverId: string, limit = 100): ServerMetricPoint[] {
		return this.metricsRepo.getByServerId(serverId, limit);
	}

	// Incidents
	public addIncident(incident: IncidentEvent): void {
		this.incidentsRepo.insert(incident);
	}

	public getAllIncidents(limit = 1000): IncidentEvent[] {
		return this.incidentsRepo.getAll(limit);
	}

	public getServerIncidents(serverId: string, limit = 100): IncidentEvent[] {
		return this.incidentsRepo.getByServerId(serverId, limit);
	}

	// Maintenance
	public cleanupOldData(): {
		metricsDeleted: number;
		incidentsDeleted: number;
	} {
		this.flushMetrics();

		const metricsDeleted = this.metricsRepo.deleteOlderThan(
			this.settings.metricsRetentionDays,
		);
		const incidentsDeleted = this.incidentsRepo.deleteOlderThan(
			this.settings.incidentsRetentionDays,
		);

		return { metricsDeleted, incidentsDeleted };
	}

	public vacuum(): void {
		this.databaseStore.vacuum();
	}

	public getStats() {
		this.flushMetrics();

		return this.databaseStore.getStats();
	}

	public getRetentionSettings() {
		return { ...this.settings };
	}

	public updateRetentionSettings(input: DataRetentionSettingsUpdateInput) {
		this.settings = normalizeRetentionSettings(input, this.settings);
		this.persistRetentionSettings();
		this.syncAutoCleanup();

		return this.getRetentionSettings();
	}

	// Auto cleanup
	private loadRetentionSettings(defaultSettings: DataRetentionSettings) {
		return normalizeRetentionSettings(
			{
				dataRetentionEnabled: this.readBooleanMetadata(dataRetentionEnabledKey),
				incidentsRetentionDays: this.readNumberMetadata(incidentsRetentionKey),
				metricsRetentionDays: this.readNumberMetadata(metricsRetentionKey),
			},
			defaultSettings,
		);
	}

	private persistRetentionSettings() {
		this.databaseStore.setMetadata(
			dataRetentionEnabledKey,
			String(this.settings.dataRetentionEnabled),
		);
		this.databaseStore.setMetadata(
			incidentsRetentionKey,
			String(this.settings.incidentsRetentionDays),
		);
		this.databaseStore.setMetadata(
			metricsRetentionKey,
			String(this.settings.metricsRetentionDays),
		);
	}

	private readBooleanMetadata(key: string) {
		const value = this.databaseStore.getMetadata(key);
		if (value === null) return undefined;

		return value === "true";
	}

	private readNumberMetadata(key: string) {
		const value = this.databaseStore.getMetadata(key);
		if (value === null) return undefined;

		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : undefined;
	}

	private syncAutoCleanup() {
		this.stopAutoCleanup();

		if (this.settings.dataRetentionEnabled) {
			this.startAutoCleanup();
		}
	}

	private startAutoCleanup(): void {
		const intervalMs = 24 * 60 * 60 * 1000; // 24 hours
		this.cleanupTimer = setInterval(() => {
			this.runAutoCleanup();
		}, intervalMs);

		// Run initial cleanup after 1 minute
		this.initialCleanupTimer = setTimeout(() => {
			this.initialCleanupTimer = null;
			this.runAutoCleanup();
		}, 60000);
	}

	private runAutoCleanup() {
		try {
			const result = this.cleanupOldData();
			console.log(
				`Auto cleanup: ${result.metricsDeleted} metrics, ${result.incidentsDeleted} incidents deleted`,
			);
		} catch (error) {
			console.error("Auto cleanup failed:", error);
		}
	}

	public stopAutoCleanup(): void {
		if (this.cleanupTimer) {
			clearInterval(this.cleanupTimer);
			this.cleanupTimer = null;
		}
		if (this.initialCleanupTimer) {
			clearTimeout(this.initialCleanupTimer);
			this.initialCleanupTimer = null;
		}
	}

	public close(): void {
		this.stopAutoCleanup();
		this.flushMetrics();
		this.databaseStore.close();
	}
}
