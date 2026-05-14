import type { StoredServer } from "../../../../shared/types";

export const filterServers = (servers: StoredServer[], query: string) => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) return servers;

  return servers
    .map((server) => ({
      ...server,
      apps: server.apps.filter((app) => {
        return (
          app.name.toLowerCase().includes(normalizedQuery) ||
          app.kind.toLowerCase().includes(normalizedQuery) ||
          app.status.toLowerCase().includes(normalizedQuery)
        );
      })
    }))
    .filter((server) => {
      return (
        server.serverName.toLowerCase().includes(normalizedQuery) ||
        server.host.hostname.toLowerCase().includes(normalizedQuery) ||
        server.apps.length > 0
      );
    });
};
