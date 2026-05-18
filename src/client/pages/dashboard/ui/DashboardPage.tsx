import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CircleAlert, Pin, Server, WifiOff } from "lucide-react";
import { routes } from "@/shared/config/routes";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { LocalDockerPanel } from "@/widgets/localDocker";
import { ServerList } from "@/widgets/serverList";
import { SummaryStats } from "@/widgets/summaryStats";
import { DashboardHeader } from "@/widgets/dashboardHeader";
import { useMonitorShellContext } from "@/widgets/monitorShell";
import {
	filterDashboardServers,
	sortDashboardServers,
	type DashboardServerFilter,
} from "../model/dashboardServerFilters";

const dashboardFilterOptions: Array<{
	icon: typeof Server;
	label: string;
	value: DashboardServerFilter;
}> = [
	{ icon: Server, label: "All", value: "all" },
	{ icon: Pin, label: "Pinned", value: "pinned" },
	{ icon: CircleAlert, label: "Critical", value: "critical" },
	{ icon: AlertTriangle, label: "Warning", value: "warning" },
	{ icon: WifiOff, label: "Offline", value: "offline" },
];

export function DashboardPage() {
	const navigate = useNavigate();
	const [serverFilter, setServerFilter] =
		useState<DashboardServerFilter>("all");
	const {
		activeScanId,
		filteredServers,
		handleScanAll,
		handleScanServer,
		isAnyScanActive,
		isScanAllActive,
		localDockerScanner,
		monitorRuntime,
		now,
		overview,
		pinnedItems,
		query,
		serverAlertPolicy,
		setQuery,
	} = useMonitorShellContext();

	const openServerDetail = (serverId: string) => {
		navigate(routes.serverDetail(serverId));
		window.scrollTo({ top: 0 });
	};
	const incidents =
		overview?.servers.flatMap((server) => server.incidents ?? []) ?? [];
	const visibleServers = useMemo(
		() =>
			sortDashboardServers(
				filterDashboardServers(
					filteredServers,
					serverFilter,
					pinnedItems.isServerPinned,
				),
				pinnedItems.isServerPinned,
			),
		[filteredServers, pinnedItems.isServerPinned, serverFilter],
	);

	return (
		<>
			<DashboardHeader
				incidents={incidents}
				isScanAllDisabled={isAnyScanActive}
				isScanningAll={isScanAllActive}
				now={now}
				onScanAll={handleScanAll}
				query={query}
				onQueryChange={setQuery}
			/>

			<SummaryStats overview={overview} />
			<div className="mb-4 flex items-center justify-between gap-3 max-lg:flex-col max-lg:items-start">
				<div>
					<div className="text-sm font-extrabold text-slate-900">
						Health view
					</div>
					<div className="mt-0.5 text-xs font-semibold text-slate-500">
						Focus the server list by operational state.
					</div>
				</div>
				<SegmentedControl
					ariaLabel="Dashboard server health filter"
					className="max-md:w-full"
					onChange={setServerFilter}
					options={dashboardFilterOptions}
					size="sm"
					value={serverFilter}
				/>
			</div>
			<LocalDockerPanel
				isScanDisabled={isAnyScanActive}
				isScanning={localDockerScanner.activeScanSource === "panel"}
				onScan={() => {
					if (isAnyScanActive) return;
					void localDockerScanner.scanFrom("panel");
				}}
			/>
			<ServerList
				activeScanId={activeScanId}
				alertPolicy={serverAlertPolicy.policy}
				alertPolicyError={serverAlertPolicy.error}
				hasActiveFilter={serverFilter !== "all"}
				isAlertPolicyLoading={serverAlertPolicy.isLoading}
				isMonitorRuntimeLoading={monitorRuntime.isLoading}
				isScanDisabled={isAnyScanActive}
				isSavingAlertPolicy={serverAlertPolicy.isSaving}
				isSavingMonitorRuntime={monitorRuntime.isSaving}
				isServerPinned={pinnedItems.isServerPinned}
				monitorRuntimeError={monitorRuntime.error}
				monitorRuntimeSettings={monitorRuntime.settings}
				now={now}
				onOpenServer={openServerDetail}
				onSaveAlertPolicy={serverAlertPolicy.savePolicy}
				onSaveMonitorRuntime={monitorRuntime.saveSettings}
				onScanServer={handleScanServer}
				onToggleServerPin={pinnedItems.toggleServerPin}
				query={query}
				servers={visibleServers}
			/>
		</>
	);
}
