import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { databaseSchemaSql } from "./database/schema";
import type { DatabaseStats } from "../../shared/types";

export interface DatabaseStoreConfig {
	databasePath: string;
	schemaPath?: string;
}

export class DatabaseStore {
	private db: Database.Database;
	private initialized = false;

	constructor(private readonly config: DatabaseStoreConfig) {
		const dir = path.dirname(this.config.databasePath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		this.db = new Database(this.config.databasePath);
		this.configurePragmas();
		this.initializeSchema();
		this.initialized = true;
	}

	private configurePragmas(): void {
		this.db.pragma("journal_mode = WAL");
		this.db.pragma("synchronous = NORMAL");
		this.db.pragma("cache_size = -64000");
		this.db.pragma("temp_store = MEMORY");
		this.db.pragma("mmap_size = 30000000000");
		this.db.pragma("page_size = 4096");
	}

	private initializeSchema(): void {
		const schema = this.config.schemaPath
			? fs.readFileSync(this.config.schemaPath, "utf-8")
			: databaseSchemaSql;
		this.db.exec(schema);
		this.ensureColumn("incidents", "previous_value", "previous_value REAL");
		this.setMetadata("schema_version", "3");
	}

	private ensureColumn(table: string, column: string, definition: string) {
		const columns = this.db
			.prepare(`PRAGMA table_info(${table})`)
			.all() as Array<{ name: string }>;
		if (columns.some((item) => item.name === column)) return;

		this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
	}

	public getDatabase(): Database.Database {
		if (!this.initialized) {
			throw new Error("DatabaseStore not initialized");
		}
		return this.db;
	}

	public getStats(): DatabaseStats {
		const metricsStmt = this.db.prepare(
			"SELECT COUNT(*) as count FROM server_metrics",
		);
		const incidentsStmt = this.db.prepare(
			"SELECT COUNT(*) as count FROM incidents",
		);
		const versionStmt = this.db.prepare(
			"SELECT value FROM db_metadata WHERE key = 'schema_version'",
		);

		const metricsCount = (metricsStmt.get() as { count: number }).count;
		const incidentsCount = (incidentsStmt.get() as { count: number }).count;
		const versionRow = versionStmt.get() as { value: string } | undefined;

		return {
			metricsCount,
			incidentsCount,
			schemaVersion: versionRow?.value ?? null,
		};
	}

	public vacuum(): void {
		this.db.exec("VACUUM");
	}

	public getMetadata(key: string) {
		const stmt = this.db.prepare("SELECT value FROM db_metadata WHERE key = ?");
		const row = stmt.get(key) as { value: string } | undefined;

		return row?.value ?? null;
	}

	public setMetadata(key: string, value: string) {
		const stmt = this.db.prepare(`
			INSERT INTO db_metadata (key, value, updated_at)
			VALUES (?, ?, datetime('now'))
			ON CONFLICT(key) DO UPDATE SET
				value = excluded.value,
				updated_at = excluded.updated_at
		`);
		stmt.run(key, value);
	}

	public close(): void {
		if (this.initialized) {
			this.db.close();
			this.initialized = false;
		}
	}
}
