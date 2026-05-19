import assert from "node:assert/strict";
import test from "node:test";
import type { StoredServer } from "../../../shared/types";
import { buildOverview } from "./overviewProjection";

const storedServer = (
	serverId: string,
	lastSeenAt: string,
	appHealth: "healthy" | "warning" | "down",
): StoredServer => ({
	serverId,
	serverName: `Server ${serverId}`,
	collectorVersion: "test",
	observedAt: lastSeenAt,
	lastSeenAt,
	online: true,
	status: "healthy",
	host: {
		hostname: serverId,
		platform: "linux",
		arch: "x64",
		uptimeSeconds: 1000,
		loadAverage: [0.1, 0.2, 0.3],
		cpuCount: 4,
		memoryTotalBytes: 8_000_000_000,
		memoryFreeBytes: 4_000_000_000,
	},
	apps: [
		{
			id: `app-${serverId}`,
			name: `App on ${serverId}`,
			kind: "docker",
			status: "running",
			health: appHealth,
			monitoring: { importance: "normal" },
		},
	],
	incidents: [],
});

test("marks all apps as down when server goes offline", () => {
	const now = new Date("2026-05-18T10:00:00.000Z");
	const offlineAfterMs = 60_000;
	const recentServer = storedServer(
		"recent",
		"2026-05-18T09:59:30.000Z",
		"healthy",
	);
	const offlineServer = storedServer(
		"offline",
		"2026-05-18T09:58:00.000Z",
		"healthy",
	);

	const overview = buildOverview(
		[recentServer, offlineServer],
		offlineAfterMs,
		now,
	);

	const recent = overview.servers.find((s) => s.serverId === "recent");
	const offline = overview.servers.find((s) => s.serverId === "offline");

	assert.ok(recent);
	assert.ok(offline);

	assert.equal(recent.online, true);
	assert.equal(recent.apps[0]?.health, "healthy");

	assert.equal(offline.online, false);
	assert.equal(offline.apps[0]?.health, "down");
});

test("summary counts offline server apps as down not healthy", () => {
	const now = new Date("2026-05-18T10:00:00.000Z");
	const offlineAfterMs = 60_000;
	const onlineHealthy = storedServer(
		"online-healthy",
		"2026-05-18T09:59:30.000Z",
		"healthy",
	);
	const offlineHealthy = storedServer(
		"offline-healthy",
		"2026-05-18T09:58:00.000Z",
		"healthy",
	);

	const overview = buildOverview(
		[onlineHealthy, offlineHealthy],
		offlineAfterMs,
		now,
	);

	assert.equal(overview.summary.healthyApps, 1);
	assert.equal(overview.summary.downApps, 1);
	assert.equal(overview.summary.unknownApps, 0);
});
