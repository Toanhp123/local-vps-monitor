import type { StoredServer } from "@shared/types";
import { ServerTableRow } from "@/entities/server";
import { PinToggleButton } from "@/features/pinnedItems";
import { ScanServerButton } from "@/features/serverScan";
import { Badge } from "@/shared/ui/Badge";
import { DataTable, DataTableBody } from "@/shared/ui/DataTable";
import { Panel, PanelHeader } from "@/shared/ui/Panel";
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
		<Panel
			id="vps"
			className="scroll-mt-6"
		>
			<PanelHeader
				description="Click a server to open its detail view"
				title="Server Overview"
				actions={<Badge size="lg">{servers.length} servers</Badge>}
			/>

			{servers.length === 0 ? (
				<ServerListEmptyState title={emptyTitle} />
			) : (
				<DataTable minWidth="min-w-260">
					<ServerTableHeader />
					<DataTableBody>
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
					</DataTableBody>
				</DataTable>
			)}
		</Panel>
	);
}
