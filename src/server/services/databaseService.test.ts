import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import type { IncidentEvent } from "../../shared/types";
import { DatabaseService } from "./databaseService";
import { DatabaseStore } from "../stores/databaseStore";

const createTempService = () => {
	const dir = mkdtempSync(path.join(tmpdir(), "vps-monitor-db-"));
	const dbPath = path.join(dir, "monitor.db");
	const store = new DatabaseStore({ databasePath: dbPath });
	const service = new DatabaseService(store, {
		dataRetentionEnabled: false,
		incidentsRetentionDays: 30,
		metricsRetentionDays: 30,
	});

	return {
		close: () => {
			service.close();
			rmSync(dir, { force: true, recursive: true });
		},
		dbPath,
		service,
	};
};

const incident = (
	id: string,
	occurredAt: string,
	severity: IncidentEvent["severity"] = "resolved",
): IncidentEvent => ({
	id,
	currentValue: 2,
	kind: "app-restart",
	message: `Incident ${id}`,
	occurredAt,
	previousValue: 1,
	serverId: "server-1",
	serverName: "Server 1",
	severity,
	title: `Incident ${id}`,
});

test("stores metrics and incidents in sqlite", () => {
	const { close, service } = createTempService();

	try {
		service.addServerMetric("server-1", "Server 1", "2026-05-18T10:00:00.000Z", {
			appCount: 2,
			appCpuPercent: 12.5,
			cpuCount: 4,
			loadAverage: [0.1, 0.2, 0.3],
			memoryFreeBytes: 50,
			memoryTotalBytes: 100,
			memoryUsedBytes: 50,
			restartCount: 1,
		});
		service.addIncident(incident("incident-1", "2026-05-18T10:00:00.000Z"));

		assert.deepEqual(service.getStats(), {
			incidentsCount: 1,
			metricsCount: 1,
			schemaVersion: "3",
		});
		assert.equal(service.getServerMetrics("server-1")[0]?.memoryUsedBytes, 50);
		assert.equal(service.getServerIncidents("server-1")[0]?.previousValue, 1);
	} finally {
		close();
	}
});

test("persists retention settings in database metadata", () => {
	const first = createTempService();
	const settings = {
		dataRetentionEnabled: true,
		incidentsRetentionDays: 45,
		metricsRetentionDays: 15,
	};

	try {
		first.service.updateRetentionSettings(settings);
		first.service.close();

		const store = new DatabaseStore({ databasePath: first.dbPath });
		const second = new DatabaseService(store, {
			dataRetentionEnabled: false,
			incidentsRetentionDays: 30,
			metricsRetentionDays: 30,
		});

		try {
			assert.deepEqual(second.getRetentionSettings(), settings);
		} finally {
			second.close();
		}
	} finally {
		rmSync(path.dirname(first.dbPath), { force: true, recursive: true });
	}
});

test("cleans up old metrics and resolved incidents", () => {
	const { close, service } = createTempService();

	try {
		service.addServerMetric("server-1", "Server 1", "2000-01-01T00:00:00.000Z", {
			memoryTotalBytes: 100,
			memoryUsedBytes: 50,
		});
		service.addServerMetric("server-1", "Server 1", new Date().toISOString(), {
			memoryTotalBytes: 100,
			memoryUsedBytes: 50,
		});
		service.addIncident(incident("old-resolved", "2000-01-01T00:00:00.000Z"));
		service.addIncident(
			incident("old-critical", "2000-01-01T00:00:00.000Z", "critical"),
		);

		const result = service.cleanupOldData();

		assert.deepEqual(result, {
			incidentsDeleted: 1,
			metricsDeleted: 1,
		});
		assert.deepEqual(service.getStats(), {
			incidentsCount: 1,
			metricsCount: 1,
			schemaVersion: "3",
		});
	} finally {
		close();
	}
});
