import type { StoredServer } from "../../../../shared/types";
import { appDisplayName } from "../../../entities/application/model/appMonitoringPolicy";

export const filterServers = (
	servers: StoredServer[],
	query: string,
) => {
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) return servers;

	return servers
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
						appDisplayName(app).toLowerCase().includes(normalizedQuery) ||
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
