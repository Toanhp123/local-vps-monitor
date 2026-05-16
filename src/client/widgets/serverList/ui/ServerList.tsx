import type { StoredServer } from "../../../../shared/types";
import { ServerTableRow } from "../../../entities/server/ui/ServerTableRow";
import { PinToggleButton } from "../../../features/pinnedItems/ui/PinToggleButton";
import { ScanServerButton } from "../../../features/serverScan/ui/ScanServerButton";
import { ServerListEmptyState } from "./ServerListEmptyState";
import { ServerTableHeader } from "./ServerTableHeader";

export function ServerList({
	activeScanId,
	hasActiveFilter,
	isScanDisabled,
	isServerPinned,
	now,
	onOpenServer,
	onScanServer,
	onToggleServerPin,
	query,
	servers,
}: {
	activeScanId: string | null;
	hasActiveFilter: boolean;
	isScanDisabled: boolean;
	isServerPinned: (serverId: string) => boolean;
	now: number;
	onOpenServer: (serverId: string) => void;
	onScanServer: (serverId: string) => void;
	onToggleServerPin: (serverId: string) => void;
	query: string;
	servers: StoredServer[];
}) {
	const emptyTitle = query.trim()
		? "No matching servers"
		: hasActiveFilter
			? "No servers in this view"
			: "No servers yet";

	return (
		<section
			id="vps"
			className="scroll-mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white"
		>
			<div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4.5 py-3.5 max-md:flex-col max-md:items-stretch">
				<div>
					<h2 className="text-lg leading-tight font-extrabold text-slate-900">
						Server Overview
					</h2>
					<p className="mt-1 text-sm font-semibold text-slate-500">
						Click a server to open its detail view
					</p>
				</div>
				<span className="inline-flex min-h-8 items-center rounded-full bg-slate-100 px-3 text-sm font-extrabold text-slate-700">
					{servers.length} servers
				</span>
			</div>

			{servers.length === 0 ? (
				<ServerListEmptyState title={emptyTitle} />
			) : (
				<div className="overflow-x-auto">
					<table className="w-full min-w-260 border-collapse">
						<ServerTableHeader />
						<tbody>
							{servers.map((server) => {
								const isScanning = activeScanId === server.serverId;

								return (
									<ServerTableRow
										key={server.serverId}
										actions={
											<ScanServerButton
												ariaLabel={`Scan ${server.serverName}`}
												isDisabled={isScanDisabled}
												isScanning={isScanning}
												onScan={() =>
													onScanServer(server.serverId)
												}
											/>
										}
										now={now}
										onOpen={() => onOpenServer(server.serverId)}
										pinControl={
											<PinToggleButton
												ariaLabel={
													isServerPinned(server.serverId)
														? `Unpin ${server.serverName}`
														: `Pin ${server.serverName}`
												}
												isPinned={isServerPinned(server.serverId)}
												onToggle={() =>
													onToggleServerPin(server.serverId)
												}
											/>
										}
										server={server}
									/>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
}
