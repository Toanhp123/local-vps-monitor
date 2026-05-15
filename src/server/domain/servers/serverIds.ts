export const localDockerServerId = "local-docker";

export const isLocalDockerServer = (serverId: string) => {
	return serverId === localDockerServerId;
};
