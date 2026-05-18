import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import type {
	IncidentEvent,
	ServerMetricPoint,
	ServerSnapshotPayload,
	StoredServer,
} from "../../shared/types";
import { defaultServerAlertPolicy } from "../domain/monitoring/policies/serverResourcePolicy";
import { ConfigDocumentStore } from "../stores/database/configDocumentStore";
import { DatabaseStore } from "../stores/databaseStore";
import { MonitorStateStore } from "../stores/monitorStateStore";
import { MonitorOverviewService } from "./monitorOverviewService";

const snapshot = (): ServerSnapshotPayload => ({
	apps: [
		{
			health: "down",
			id: "app-1",
			kind: "docker",
			name: "api",
			status: "exited",
		},
	],
	collectorVersion: "test",
	host: {
		arch: "x64",
		cpuCount: 4,
		hostname: "server-1",
		loadAverage: [0.1, 0.2, 0.3],
		memoryFreeBytes: 50,
		memoryTotalBytes: 100,
		platform: "linux",
		uptimeSeconds: 100,
	},
	observedAt: "2026-05-18T10:00:00.000Z",
	serverId: "server-1",
	serverName: "Server 1",
});

const incident = (): IncidentEvent => ({
	id: "manual-incident",
	kind: "http-check",
	message: "HTTP check failed.",
	occurredAt: "2026-05-18T10:01:00.000Z",
	serverId: "server-1",
	serverName: "Server 1",
	severity: "critical",
	title: "HTTP check failed",
});

test("persists snapshot metrics and new incidents through callbacks", () => {
	const dir = mkdtempSync(path.join(tmpdir(), "vps-monitor-overview-"));
	const dbStore = new DatabaseStore({
		databasePath: path.join(dir, "monitor.db"),
	});
	const metrics: ServerMetricPoint[] = [];
	const incidents: IncidentEvent[] = [];

	try {
		const service = new MonitorOverviewService(
			new MonitorStateStore(
				new ConfigDocumentStore(dbStore.getDatabase()),
			),
			() => 60_000,
			() => [],
			() => defaultServerAlertPolicy,
			() => 60,
			() => 100,
			{
				recordIncident: (item) => incidents.push(item),
				recordServerMetric: (
					_server: StoredServer,
					_payload: ServerSnapshotPayload,
					metric: ServerMetricPoint,
				) => metrics.push(metric),
			},
		);

		service.ingestSnapshot(snapshot());

		assert.equal(metrics.length, 1);
		assert.equal(incidents.length, 1);
		assert.equal(incidents[0]?.kind, "app-health");

		service.appendServerIncident("server-1", incident());

		assert.equal(incidents.at(-1)?.id, "manual-incident");

		const reloadedState = new MonitorStateStore(
			new ConfigDocumentStore(dbStore.getDatabase()),
		);
		assert.equal(reloadedState.getServer("server-1")?.serverName, "Server 1");
	} finally {
		dbStore.close();
		rmSync(dir, { force: true, recursive: true });
	}
});
