import type Database from "better-sqlite3";
import type {
	ServerHistoricalMetricPoint,
	ServerMetricPoint,
} from "@shared/types";

export interface ServerMetricRow {
	server_id: string;
	server_name: string;
	observed_at: string;
	cpu_count: number | null;
	load_average_1m: number | null;
	load_average_5m: number | null;
	load_average_15m: number | null;
	memory_total_bytes: number | null;
	memory_used_bytes: number | null;
	memory_free_bytes: number | null;
	disk_total_bytes: number | null;
	disk_used_bytes: number | null;
	disk_used_percent: number | null;
	disk_filesystem: string | null;
	disk_mount: string | null;
	app_cpu_percent: number | null;
	app_count: number | null;
	restart_count: number | null;
}

interface MetricPointQueryRow {
	observedAt: string;
	appCpuPercent: number | null;
	diskTotalBytes: number | null;
	diskUsedBytes: number | null;
	diskUsedPercent: number | null;
	memoryUsedBytes: number | null;
	memoryTotalBytes: number | null;
	restartCount: number | null;
}

interface HistoricalMetricQueryRow extends MetricPointQueryRow {
	appCount: number | null;
	cpuCount: number | null;
	loadAverage1m: number | null;
	loadAverage5m: number | null;
	loadAverage15m: number | null;
	memoryFreeBytes: number | null;
}

const optionalNumber = (value: number | null) => {
	return typeof value === "number" && Number.isFinite(value)
		? value
		: undefined;
};

const metricPointFromRow = (row: MetricPointQueryRow): ServerMetricPoint => {
	const diskTotalBytes = optionalNumber(row.diskTotalBytes);
	const diskUsedBytes = optionalNumber(row.diskUsedBytes);
	const diskUsedPercent = optionalNumber(row.diskUsedPercent);
	const point: ServerMetricPoint = {
		observedAt: row.observedAt,
		appCpuPercent: optionalNumber(row.appCpuPercent) ?? 0,
		memoryUsedBytes: optionalNumber(row.memoryUsedBytes) ?? 0,
		memoryTotalBytes: optionalNumber(row.memoryTotalBytes) ?? 0,
		restartCount: optionalNumber(row.restartCount) ?? 0,
	};

	if (diskTotalBytes !== undefined) point.diskTotalBytes = diskTotalBytes;
	if (diskUsedBytes !== undefined) point.diskUsedBytes = diskUsedBytes;
	if (diskUsedPercent !== undefined) point.diskUsedPercent = diskUsedPercent;

	return point;
};

const historicalPointFromRow = (
	row: HistoricalMetricQueryRow,
): ServerHistoricalMetricPoint => {
	const appCount = optionalNumber(row.appCount);
	const cpuCount = optionalNumber(row.cpuCount);
	const loadAverage1m = optionalNumber(row.loadAverage1m);
	const loadAverage5m = optionalNumber(row.loadAverage5m);
	const loadAverage15m = optionalNumber(row.loadAverage15m);
	const memoryFreeBytes = optionalNumber(row.memoryFreeBytes);
	const point: ServerHistoricalMetricPoint = metricPointFromRow(row);

	if (appCount !== undefined) point.appCount = appCount;
	if (cpuCount !== undefined) point.cpuCount = cpuCount;
	if (loadAverage1m !== undefined) point.loadAverage1m = loadAverage1m;
	if (loadAverage5m !== undefined) point.loadAverage5m = loadAverage5m;
	if (loadAverage15m !== undefined) {
		point.loadAverage15m = loadAverage15m;
	}
	if (memoryFreeBytes !== undefined) point.memoryFreeBytes = memoryFreeBytes;

	return point;
};

export class MetricsRepository {
	private insertStmt: Database.Statement;
	private batchBuffer: ServerMetricRow[] = [];
	private readonly batchSize = 100;

	constructor(private db: Database.Database) {
		this.insertStmt = this.db.prepare(`
			INSERT INTO server_metrics (
				server_id, server_name, observed_at,
				cpu_count, load_average_1m, load_average_5m, load_average_15m,
				memory_total_bytes, memory_used_bytes, memory_free_bytes,
				disk_total_bytes, disk_used_bytes, disk_used_percent,
				disk_filesystem, disk_mount,
				app_cpu_percent, app_count, restart_count
			) VALUES (
				@server_id, @server_name, @observed_at,
				@cpu_count, @load_average_1m, @load_average_5m, @load_average_15m,
				@memory_total_bytes, @memory_used_bytes, @memory_free_bytes,
				@disk_total_bytes, @disk_used_bytes, @disk_used_percent,
				@disk_filesystem, @disk_mount,
				@app_cpu_percent, @app_count, @restart_count
			)
		`);
	}

	public insert(metric: ServerMetricRow): void {
		this.batchBuffer.push(metric);

		if (this.batchBuffer.length >= this.batchSize) {
			this.flush();
		}
	}

	public flush(): void {
		if (this.batchBuffer.length === 0) return;

		const transaction = this.db.transaction((metrics: ServerMetricRow[]) => {
			for (const metric of metrics) {
				this.insertStmt.run(metric);
			}
		});

		transaction(this.batchBuffer);
		this.batchBuffer = [];
	}

	public getByServerId(serverId: string, limit = 100): ServerMetricPoint[] {
		this.flush();

		const stmt = this.db.prepare(`
			SELECT
				observed_at as observedAt,
				app_cpu_percent as appCpuPercent,
				disk_total_bytes as diskTotalBytes,
				disk_used_bytes as diskUsedBytes,
				disk_used_percent as diskUsedPercent,
				memory_used_bytes as memoryUsedBytes,
				memory_total_bytes as memoryTotalBytes,
				restart_count as restartCount
			FROM server_metrics
			WHERE server_id = ?
			ORDER BY observed_at DESC
			LIMIT ?
		`);

		return (stmt.all(serverId, limit) as MetricPointQueryRow[]).map(
			metricPointFromRow,
		);
	}

	public getHistoryByServerId(
		serverId: string,
		cutoffIso: string,
		limit: number,
	): ServerHistoricalMetricPoint[] {
		this.flush();

		const stmt = this.db.prepare(`
			SELECT *
			FROM (
				SELECT
					observed_at as observedAt,
					app_cpu_percent as appCpuPercent,
					app_count as appCount,
					cpu_count as cpuCount,
					disk_total_bytes as diskTotalBytes,
					disk_used_bytes as diskUsedBytes,
					disk_used_percent as diskUsedPercent,
					load_average_1m as loadAverage1m,
					load_average_5m as loadAverage5m,
					load_average_15m as loadAverage15m,
					memory_free_bytes as memoryFreeBytes,
					memory_used_bytes as memoryUsedBytes,
					memory_total_bytes as memoryTotalBytes,
					restart_count as restartCount
				FROM server_metrics
				WHERE server_id = ?
					AND observed_at >= ?
				ORDER BY observed_at DESC
				LIMIT ?
			)
			ORDER BY observedAt ASC
		`);

		return (stmt.all(serverId, cutoffIso, limit) as HistoricalMetricQueryRow[]).map(
			historicalPointFromRow,
		);
	}

	public deleteOlderThan(days: number): number {
		this.flush();

		const stmt = this.db.prepare(`
			DELETE FROM server_metrics
			WHERE julianday(observed_at) < julianday('now', '-' || ? || ' days')
		`);

		const result = stmt.run(days);
		return result.changes;
	}
}
