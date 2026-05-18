import type Database from "better-sqlite3";
import type { IncidentEvent } from "@shared/types";

export class IncidentsRepository {
	private insertStmt: Database.Statement;

	constructor(private db: Database.Database) {
		this.insertStmt = this.db.prepare(`
			INSERT OR IGNORE INTO incidents (
				id, server_id, server_name, app_id, app_name,
				kind, severity, title, message, occurred_at,
				current_health, previous_health, current_value, previous_value
			) VALUES (
				@id, @server_id, @server_name, @app_id, @app_name,
				@kind, @severity, @title, @message, @occurred_at,
				@current_health, @previous_health, @current_value, @previous_value
			)
		`);
	}

	public insert(incident: IncidentEvent): void {
		this.insertStmt.run({
			id: incident.id,
			server_id: incident.serverId,
			server_name: incident.serverName,
			app_id: incident.appId ?? null,
			app_name: incident.appName ?? null,
			kind: incident.kind,
			severity: incident.severity,
			title: incident.title,
			message: incident.message,
			occurred_at: incident.occurredAt,
			current_health: incident.currentHealth ?? null,
			previous_health: incident.previousHealth ?? null,
			current_value: incident.currentValue ?? null,
			previous_value: incident.previousValue ?? null,
		});
	}

	public getAll(limit = 1000): IncidentEvent[] {
		const stmt = this.db.prepare(`
			SELECT
				id, server_id as serverId, server_name as serverName,
				app_id as appId, app_name as appName,
				kind, severity, title, message,
				occurred_at as occurredAt,
				current_health as currentHealth, previous_health as previousHealth,
				current_value as currentValue, previous_value as previousValue
			FROM incidents
			ORDER BY occurred_at DESC
			LIMIT ?
		`);

		return stmt.all(limit) as IncidentEvent[];
	}

	public getByServerId(serverId: string, limit = 100): IncidentEvent[] {
		const stmt = this.db.prepare(`
			SELECT
				id, server_id as serverId, server_name as serverName,
				app_id as appId, app_name as appName,
				kind, severity, title, message,
				occurred_at as occurredAt,
				current_health as currentHealth, previous_health as previousHealth,
				current_value as currentValue, previous_value as previousValue
			FROM incidents
			WHERE server_id = ?
			ORDER BY occurred_at DESC
			LIMIT ?
		`);

		return stmt.all(serverId, limit) as IncidentEvent[];
	}

	public deleteOlderThan(days: number): number {
		const stmt = this.db.prepare(`
			DELETE FROM incidents
			WHERE julianday(occurred_at) < julianday('now', '-' || ? || ' days')
			AND severity = 'resolved'
		`);

		const result = stmt.run(days);
		return result.changes;
	}
}
