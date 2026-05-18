import type Database from "better-sqlite3";
import type { ServerMetricPoint } from "@shared/types";

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

		return stmt.all(serverId, limit) as ServerMetricPoint[];
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
