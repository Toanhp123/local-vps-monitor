export const routes = {
	dashboard: "/",
	httpChecks: "/http-checks",
	incidents: "/incidents",
	settings: "/settings",
	serverDetail: (serverId: string) => `/servers/${encodeURIComponent(serverId)}`,
	sshTargets: "/ssh-targets",
};
