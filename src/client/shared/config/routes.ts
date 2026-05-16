export const routes = {
	dashboard: "/",
	httpChecks: "/http-checks",
	serverDetail: (serverId: string) => `/servers/${encodeURIComponent(serverId)}`,
	sshTargets: "/ssh-targets",
};
