import assert from "node:assert/strict";
import test from "node:test";
import type {
	AppPolicy,
	DiskMetrics,
	ServerAlertThresholds,
	ServerSnapshotPayload,
} from "../../../shared/types";
import {
	buildOverview,
	createStoredServerFromSnapshot,
} from "./overviewProjection";
import { defaultServerAlertThresholds } from "./policies/serverResourcePolicy";

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

const thresholds = (
	overrides: Partial<ServerAlertThresholds> = {},
): ServerAlertThresholds => ({
	...defaultServerAlertThresholds,
	...overrides,
});

test("creates disk warning incidents", () => {
	const server = createStoredServerFromSnapshot(
		payloadWithDisk(82.4),
		undefined,
		new Date("2026-05-15T00:00:00.000Z"),
	);

	assert.equal(server.status, "warning");
	assert.equal(server.incidents.length, 1);
	assert.equal(server.incidents[0]?.kind, "disk-usage");
	assert.equal(server.incidents[0]?.severity, "warning");
});

test("uses configured incident history limit", () => {
	const warningServer = createStoredServerFromSnapshot(
		payloadWithDisk(82),
		undefined,
		new Date("2026-05-15T00:00:00.000Z"),
		[],
		undefined,
		{ incidentHistoryLimit: 1 },
	);
	const criticalServer = createStoredServerFromSnapshot(
		payloadWithDisk(91),
		warningServer,
		new Date("2026-05-15T00:01:00.000Z"),
		[],
		undefined,
		{ incidentHistoryLimit: 1 },
	);

	assert.equal(criticalServer.incidents.length, 1);
	assert.equal(criticalServer.incidents[0]?.severity, "critical");
});

test("uses per-server offline threshold when building overview", () => {
	const server = createStoredServerFromSnapshot(
		payloadWithDisk(50),
		undefined,
		new Date("2026-05-15T00:00:00.000Z"),
	);
	const overview = buildOverview(
		[server],
		(serverId) => (serverId === "server-1" ? 120_000 : 60_000),
		new Date("2026-05-15T00:01:30.000Z"),
	);

	assert.equal(overview.servers[0]?.online, true);
	assert.equal(overview.servers[0]?.status, "healthy");
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

test("uses configured disk thresholds for health and incidents", () => {
	const policy = {
		defaults: {
			...thresholds({
				diskCriticalPercent: 90,
				diskWarningPercent: 80,
			}),
		},
		serverOverrides: {
			"server-1": thresholds({
				diskCriticalPercent: 95,
				diskWarningPercent: 90,
			}),
		},
	};
	const healthyServer = createStoredServerFromSnapshot(
		payloadWithDisk(82),
		undefined,
		new Date("2026-05-15T00:00:00.000Z"),
		[],
		policy,
	);
	const warningServer = createStoredServerFromSnapshot(
		payloadWithDisk(92),
		healthyServer,
		new Date("2026-05-15T00:01:00.000Z"),
		[],
		policy,
	);

	assert.equal(healthyServer.status, "healthy");
	assert.equal(healthyServer.incidents.length, 0);
	assert.equal(warningServer.status, "warning");
	assert.equal(warningServer.incidents[0]?.kind, "disk-usage");
	assert.equal(warningServer.incidents[0]?.severity, "warning");
});

test("creates memory usage incidents from server alert thresholds", () => {
	const server = createStoredServerFromSnapshot(
		{
			...payloadWithDisk(50),
			host: {
				...payloadWithDisk(50).host,
				memoryFreeBytes: 100,
				memoryTotalBytes: 1000,
			},
		},
		undefined,
		new Date("2026-05-15T00:00:00.000Z"),
	);

	assert.equal(server.status, "warning");
	assert.equal(server.incidents[0]?.kind, "memory-usage");
	assert.equal(server.incidents[0]?.severity, "warning");
});

test("creates CPU load incidents from server alert thresholds", () => {
	const server = createStoredServerFromSnapshot(
		{
			...payloadWithDisk(50),
			host: {
				...payloadWithDisk(50).host,
				cpuCount: 2,
				loadAverage: [2, 1.8, 1.5],
			},
		},
		undefined,
		new Date("2026-05-15T00:00:00.000Z"),
	);

	assert.equal(server.status, "warning");
	assert.equal(server.incidents[0]?.kind, "cpu-load");
	assert.equal(server.incidents[0]?.severity, "critical");
});

test("ignores matching apps when projecting server health and incidents", () => {
	const policies: AppPolicy[] = [
		{
			createdAt: "2026-05-15T00:00:00.000Z",
			enabled: true,
			id: "policy-ignore-watchtower",
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
		policies,
	);

	assert.equal(server.status, "healthy");
	assert.equal(server.incidents.length, 0);
	assert.equal(server.apps[0]?.monitoring?.importance, "ignored");
});

test("uses critical policies to escalate app health incidents", () => {
	const policies: AppPolicy[] = [
		{
			appId: "docker-api",
			createdAt: "2026-05-15T00:00:00.000Z",
			displayName: "Public API",
			enabled: true,
			id: "policy-critical-api",
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
		policies,
	);

	assert.equal(server.status, "down");
	assert.equal(server.incidents[0]?.severity, "critical");
	assert.equal(server.incidents[0]?.appName, "Public API");
	assert.equal(server.apps[0]?.monitoring?.importance, "critical");
});
