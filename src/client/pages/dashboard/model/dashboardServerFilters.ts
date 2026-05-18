import type { HealthStatus, StoredServer } from "@shared/types";

export type DashboardServerFilter =
	| "all"
	| "critical"
	| "offline"
	| "pinned"
	| "warning";

const serverSeverityRank = (server: StoredServer) => {
	if (!server.online) return 4;

	const ranks: Record<HealthStatus, number> = {
		down: 3,
		warning: 2,
		unknown: 1,
		healthy: 0,
	};

	return ranks[server.status];
};

export const filterDashboardServers = (
	servers: StoredServer[],
	filter: DashboardServerFilter,
	isServerPinned: (serverId: string) => boolean,
) => {
	if (filter === "all") return servers;

	return servers.filter((server) => {
		if (filter === "pinned") return isServerPinned(server.serverId);
		if (filter === "offline") return !server.online;
		if (filter === "critical") return server.online && server.status === "down";
		return server.online && server.status === "warning";
	});
};

export const sortDashboardServers = (
	servers: StoredServer[],
	isServerPinned: (serverId: string) => boolean,
) =>
	[...servers].sort((first, second) => {
		const pinnedDelta =
			Number(isServerPinned(second.serverId)) -
			Number(isServerPinned(first.serverId));
		if (pinnedDelta !== 0) return pinnedDelta;

		const severityDelta = serverSeverityRank(second) - serverSeverityRank(first);
		if (severityDelta !== 0) return severityDelta;

		return first.serverName.localeCompare(second.serverName);
	});
