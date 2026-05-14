import type { StoredServer } from "../../../../shared/types";

export const serverMemory = (server: StoredServer) => {
	const used = Math.max(
		0,
		server.host.memoryTotalBytes - server.host.memoryFreeBytes,
	);
	const percent = server.host.memoryTotalBytes
		? Math.round((used / server.host.memoryTotalBytes) * 100)
		: 0;

	return { used, percent };
};
