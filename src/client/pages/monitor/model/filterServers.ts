import type { AppSnapshot, StoredServer } from "../../../../shared/types";
import type { ServerViewFilter } from "../../../entities/server/model/serverViewFilter";

const filterAppsByView = (
	apps: AppSnapshot[],
	viewFilter: ServerViewFilter,
) => {
	if (viewFilter === "warnings") {
		return apps.filter((app) => app.health === "warning");
	}

	if (viewFilter === "down") {
		return apps.filter((app) => app.health === "down");
	}

	if (viewFilter === "needs-attention") {
		return apps.filter(
			(app) => app.health === "warning" || app.health === "down",
		);
	}

	if (viewFilter === "docker") {
		return apps.filter((app) => app.kind === "docker");
	}

	if (viewFilter === "pm2") {
		return apps.filter((app) => app.kind === "pm2");
	}

	return apps;
};

const applyViewFilter = (
	server: StoredServer,
	viewFilter: ServerViewFilter,
) => {
	if (viewFilter === "offline") {
		return server.online ? null : server;
	}

	const apps = filterAppsByView(server.apps, viewFilter);

	if (viewFilter === "all") return server;
	if (viewFilter === "needs-attention" && !server.online) return server;
	if (apps.length === 0) return null;

	return {
		...server,
		apps,
	};
};

export const filterServers = (
	servers: StoredServer[],
	query: string,
	viewFilter: ServerViewFilter,
) => {
	const normalizedQuery = query.trim().toLowerCase();
	const viewFilteredServers = servers.flatMap((server) => {
		const nextServer = applyViewFilter(server, viewFilter);
		return nextServer ? [nextServer] : [];
	});

	if (!normalizedQuery) return viewFilteredServers;

	return viewFilteredServers
		.map((server) => {
			const serverMatches =
				server.serverName.toLowerCase().includes(normalizedQuery) ||
				server.host.hostname.toLowerCase().includes(normalizedQuery) ||
				server.host.platform.toLowerCase().includes(normalizedQuery) ||
				server.host.arch.toLowerCase().includes(normalizedQuery);

			if (serverMatches) return server;

			return {
				...server,
				apps: server.apps.filter((app) => {
					return (
						app.name.toLowerCase().includes(normalizedQuery) ||
						app.group?.name.toLowerCase().includes(normalizedQuery) ||
						app.kind.toLowerCase().includes(normalizedQuery) ||
						app.status.toLowerCase().includes(normalizedQuery) ||
						app.health.toLowerCase().includes(normalizedQuery)
					);
				}),
			};
		})
		.filter((server) => {
			return (
				server.serverName.toLowerCase().includes(normalizedQuery) ||
				server.host.hostname.toLowerCase().includes(normalizedQuery) ||
				server.apps.length > 0
			);
		});
};
