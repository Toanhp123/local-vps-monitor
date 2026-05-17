import type {
	MonitorRuntimeSettings,
	MonitorRuntimeSettingsUpdateInput,
	ServerAlertPolicy,
	ServerAlertPolicyUpdateInput,
	StoredServer,
} from "@shared/types";
import { ServerTableRow } from "@/entities/server";
import { ServerMonitorRuntimeDialog } from "@/features/monitorRuntime";
import { PinToggleButton } from "@/features/pinnedItems";
import { ServerAlertPolicyDialog } from "@/features/serverAlertPolicy";
import { ScanServerButton } from "@/features/serverScan";
import { Badge } from "@/shared/ui/Badge";
import { DataTable, DataTableBody } from "@/shared/ui/DataTable";
import { Panel, PanelHeader } from "@/shared/ui/Panel";
import { ServerListEmptyState } from "./ServerListEmptyState";
import { ServerTableHeader } from "./ServerTableHeader";

export function ServerList({
	activeScanId,
	alertPolicy,
	alertPolicyError,
	hasActiveFilter,
	isScanDisabled,
	isAlertPolicyLoading,
	isMonitorRuntimeLoading,
	isSavingAlertPolicy,
	isSavingMonitorRuntime,
	monitorRuntimeError,
	monitorRuntimeSettings,
	isServerPinned,
	now,
	onSaveMonitorRuntime,
	onSaveAlertPolicy,
	onOpenServer,
	onScanServer,
	onToggleServerPin,
	query,
	servers,
}: {
	activeScanId: string | null;
	alertPolicy: ServerAlertPolicy | null;
	alertPolicyError: string;
	hasActiveFilter: boolean;
	isAlertPolicyLoading: boolean;
	isMonitorRuntimeLoading: boolean;
	isScanDisabled: boolean;
	isSavingAlertPolicy: boolean;
	isSavingMonitorRuntime: boolean;
	isServerPinned: (serverId: string) => boolean;
	monitorRuntimeError: string;
	monitorRuntimeSettings: MonitorRuntimeSettings | null;
	now: number;
	onSaveMonitorRuntime: (
		input: MonitorRuntimeSettingsUpdateInput,
	) => Promise<boolean>;
	onSaveAlertPolicy: (input: ServerAlertPolicyUpdateInput) => Promise<boolean>;
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
										<>
											<ServerAlertPolicyDialog
												error={alertPolicyError}
												isLoading={isAlertPolicyLoading}
												isSaving={isSavingAlertPolicy}
												onSavePolicy={onSaveAlertPolicy}
												policy={alertPolicy}
												server={server}
											/>
											<ServerMonitorRuntimeDialog
												error={monitorRuntimeError}
												isLoading={isMonitorRuntimeLoading}
												isSaving={isSavingMonitorRuntime}
												onSaveSettings={onSaveMonitorRuntime}
												server={server}
												settings={monitorRuntimeSettings}
											/>
											<ScanServerButton
												ariaLabel={`Scan ${server.serverName}`}
												isDisabled={isScanDisabled}
												isScanning={isScanning}
												onScan={() =>
													onScanServer(server.serverId)
												}
											/>
										</>
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
