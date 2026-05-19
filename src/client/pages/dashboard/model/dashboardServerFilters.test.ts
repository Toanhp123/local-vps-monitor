import assert from "node:assert/strict";
import test from "node:test";
import type { StoredServer } from "@shared/types";
import {
	filterDashboardServers,
	sortDashboardServers,
	type DashboardServerFilter,
} from "./dashboardServerFilters";

const server = ({
	serverId,
	serverName,
	...overrides
}: Partial<StoredServer> &
	Pick<StoredServer, "serverId" | "serverName">): StoredServer => ({
	serverId,
	serverName,
	collectorVersion: "test",
	observedAt: "2026-05-18T00:00:00.000Z",
	lastSeenAt: "2026-05-18T00:00:00.000Z",
	online: true,
	status: "healthy",
	host: {
		hostname: serverName,
		platform: "linux",
		arch: "x64",
		uptimeSeconds: 1,
		loadAverage: [0, 0, 0],
		cpuCount: 1,
		memoryTotalBytes: 1,
		memoryFreeBytes: 1,
	},
	apps: [],
	incidents: [],
	...overrides,
});

test("filters dashboard servers by health-focused view", () => {
	const servers = [
		server({ serverId: "healthy", serverName: "Healthy", status: "healthy" }),
		server({ serverId: "warning", serverName: "Warning", status: "warning" }),
		server({ serverId: "down", serverName: "Down", status: "down" }),
		server({ serverId: "offline", serverName: "Offline", online: false }),
	];
	const pinned = new Set(["healthy"]);

	const idsFor = (filter: DashboardServerFilter) =>
		filterDashboardServers(servers, filter, (serverId) => pinned.has(serverId)).map(
			(item) => item.serverId,
		);

	assert.deepEqual(idsFor("all"), ["healthy", "warning", "down", "offline"]);
	assert.deepEqual(idsFor("pinned"), ["healthy"]);
	assert.deepEqual(idsFor("warning"), ["warning"]);
	assert.deepEqual(idsFor("critical"), ["down"]);
	assert.deepEqual(idsFor("offline"), ["offline"]);
});

test("sorts pinned servers first then by severity then by name", () => {
	const servers = [
		server({ serverId: "healthy-a", serverName: "Zulu", status: "healthy" }),
		server({ serverId: "down-b", serverName: "Bravo", status: "down" }),
		server({ serverId: "warning-c", serverName: "Charlie", status: "warning" }),
		server({ serverId: "down-a", serverName: "Alpha", status: "down" }),
		server({ serverId: "pinned-healthy", serverName: "Pinned", status: "healthy" }),
	];
	const pinned = new Set(["pinned-healthy"]);

	assert.deepEqual(
		sortDashboardServers(servers, (serverId) => pinned.has(serverId)).map(
			(item) => item.serverId,
		),
		["pinned-healthy", "down-a", "down-b", "warning-c", "healthy-a"],
	);
});
