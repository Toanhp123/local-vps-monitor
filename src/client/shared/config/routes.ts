export const routes = {
	dashboard: "/",
	httpChecks: "/http-checks",
	settings: "/settings",
	serverDetail: (serverId: string) => `/servers/${encodeURIComponent(serverId)}`,
	sshTargets: "/ssh-targets",
};
