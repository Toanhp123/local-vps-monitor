import { Server } from "lucide-react";
import type { StoredServer } from "../../../../shared/types";
import { ServerPanel } from "../../../entities/server/ui/ServerPanel";

export function ServerList({
	activeScanId,
	now,
	onScanServer,
	servers,
}: {
	activeScanId: string | null;
	now: number;
	onScanServer: (serverId: string) => void;
	servers: StoredServer[];
}) {
	return (
		<section className="grid gap-4">
			{servers.map((server) => (
				<ServerPanel
					isScanDisabled={Boolean(activeScanId)}
					isScanning={activeScanId === server.serverId}
					key={server.serverId}
					now={now}
					onScan={() => onScanServer(server.serverId)}
					server={server}
				/>
			))}
			{servers.length === 0 && (
				<div className="flex min-h-45 flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-slate-400 bg-white text-slate-500">
					<Server size={28} />
					<strong>No servers found</strong>
				</div>
			)}
		</section>
	);
}
