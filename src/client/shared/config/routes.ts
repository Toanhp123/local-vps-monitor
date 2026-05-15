export const routes = {
	dashboard: "/",
	serverDetail: (serverId: string) => `/servers/${encodeURIComponent(serverId)}`,
};
