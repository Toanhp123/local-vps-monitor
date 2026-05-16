import assert from "node:assert/strict";
import test from "node:test";
import type {
	AppMonitorRule,
	DiskMetrics,
	ServerSnapshotPayload,
} from "../../../shared/types";
import { createStoredServerFromSnapshot } from "./overviewProjection";

const diskForPercent = (usedPercent: number): DiskMetrics => {
	const totalBytes = 100 * 1024 * 1024;
	const usedBytes = Math.round((totalBytes * usedPercent) / 100);

	return {
		availableBytes: totalBytes - usedBytes,
		filesystem: "/dev/vda1",
		mount: "/",
		totalBytes,
		usedBytes,
		usedPercent,
	};
};

const payloadWithDisk = (usedPercent: number): ServerSnapshotPayload => ({
	apps: [],
	collectorVersion: "test",
	host: {
		arch: "x64",
		cpuCount: 2,
		disk: diskForPercent(usedPercent),
		hostname: "test-host",
		loadAverage: [0, 0, 0],
		memoryFreeBytes: 512,
		memoryTotalBytes: 1024,
		platform: "linux",
		uptimeSeconds: 100,
	},
	observedAt: "2026-05-15T00:00:00.000Z",
	serverId: "server-1",
	serverName: "Production VPS",
});

const payloadWithApps = (
	apps: ServerSnapshotPayload["apps"],
): ServerSnapshotPayload => ({
	...payloadWithDisk(50),
	apps,
	host: {
		...payloadWithDisk(50).host,
		disk: undefined,
	},
});

test("creates disk warning incidents and stores disk metric history", () => {
	const server = createStoredServerFromSnapshot(
		payloadWithDisk(82.4),
		undefined,
		new Date("2026-05-15T00:00:00.000Z"),
	);

	assert.equal(server.status, "warning");
	assert.equal(server.incidents.length, 1);
	assert.equal(server.incidents[0]?.kind, "disk-usage");
	assert.equal(server.incidents[0]?.severity, "warning");
	assert.equal(server.metricsHistory[0]?.diskUsedPercent, 82.4);
});

test("creates disk critical and recovery incidents only when threshold state changes", () => {
	const warningServer = createStoredServerFromSnapshot(
		payloadWithDisk(82),
		undefined,
		new Date("2026-05-15T00:00:00.000Z"),
	);
	const stillWarningServer = createStoredServerFromSnapshot(
		payloadWithDisk(85),
		warningServer,
		new Date("2026-05-15T00:01:00.000Z"),
	);
	const criticalServer = createStoredServerFromSnapshot(
		payloadWithDisk(91),
		stillWarningServer,
		new Date("2026-05-15T00:02:00.000Z"),
	);
	const recoveredServer = createStoredServerFromSnapshot(
		payloadWithDisk(70),
		criticalServer,
		new Date("2026-05-15T00:03:00.000Z"),
	);

	assert.equal(stillWarningServer.incidents.length, 1);
	assert.equal(criticalServer.incidents[0]?.severity, "critical");
	assert.equal(recoveredServer.incidents[0]?.severity, "resolved");
	assert.equal(recoveredServer.status, "healthy");
});

test("ignores matching apps when projecting server health and incidents", () => {
	const rules: AppMonitorRule[] = [
		{
			createdAt: "2026-05-15T00:00:00.000Z",
			enabled: true,
			id: "rule-ignore-watchtower",
			importance: "ignored",
			match: "watchtower",
			matchMode: "contains",
			name: "Ignore Watchtower",
			updatedAt: "2026-05-15T00:00:00.000Z",
		},
	];
	const server = createStoredServerFromSnapshot(
		payloadWithApps([
			{
				health: "down",
				id: "docker-watchtower",
				kind: "docker",
				name: "watchtower",
				status: "exited",
			},
		]),
		undefined,
		new Date("2026-05-15T00:00:00.000Z"),
		rules,
	);

	assert.equal(server.status, "healthy");
	assert.equal(server.incidents.length, 0);
	assert.equal(server.apps[0]?.monitoring?.importance, "ignored");
});

test("uses critical rules to escalate app health incidents", () => {
	const rules: AppMonitorRule[] = [
		{
			appId: "docker-api",
			createdAt: "2026-05-15T00:00:00.000Z",
			displayName: "Public API",
			enabled: true,
			id: "rule-critical-api",
			importance: "critical",
			name: "Public API override",
			serverId: "server-1",
			updatedAt: "2026-05-15T00:00:00.000Z",
		},
	];
	const server = createStoredServerFromSnapshot(
		payloadWithApps([
			{
				health: "down",
				id: "docker-api",
				kind: "docker",
				name: "api-1",
				status: "exited",
			},
		]),
		undefined,
		new Date("2026-05-15T00:00:00.000Z"),
		rules,
	);

	assert.equal(server.status, "down");
	assert.equal(server.incidents[0]?.severity, "critical");
	assert.equal(server.incidents[0]?.appName, "Public API");
	assert.equal(server.apps[0]?.monitoring?.importance, "critical");
});
