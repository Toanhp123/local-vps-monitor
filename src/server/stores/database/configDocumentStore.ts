import fs from "node:fs";
import type Database from "better-sqlite3";

export interface LegacyConfigDocument {
	found: boolean;
	value?: unknown;
}

export class ConfigDocumentStore {
	private getStmt: Database.Statement;
	private setStmt: Database.Statement;

	constructor(private readonly db: Database.Database) {
		this.getStmt = this.db.prepare(`
			SELECT value_json as valueJson
			FROM app_config
			WHERE key = ?
		`);
		this.setStmt = this.db.prepare(`
			INSERT INTO app_config (key, value_json, updated_at)
			VALUES (?, ?, datetime('now'))
			ON CONFLICT(key) DO UPDATE SET
				value_json = excluded.value_json,
				updated_at = excluded.updated_at
		`);
	}

	get<T>(key: string) {
		const row = this.getStmt.get(key) as { valueJson: string } | undefined;
		if (!row) return null;

		try {
			return JSON.parse(row.valueJson) as T;
		} catch (error) {
			console.warn(
				`Cannot parse config document '${key}' from database:`,
				error,
			);
			return null;
		}
	}

	set(key: string, value: unknown) {
		this.setStmt.run(key, JSON.stringify(value));
	}
}

export const readLegacyConfigDocument = (
	filePath: string,
	label: string,
): LegacyConfigDocument => {
	if (!fs.existsSync(filePath)) return { found: false };

	try {
		return {
			found: true,
			value: JSON.parse(fs.readFileSync(filePath, "utf8")),
		};
	} catch (error) {
		console.warn(`Cannot read ${label} at ${filePath}:`, error);
		return { found: false };
	}
};
