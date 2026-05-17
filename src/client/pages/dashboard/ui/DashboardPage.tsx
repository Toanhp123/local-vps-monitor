import { useNavigate } from "react-router-dom";
import { routes } from "@/shared/config/routes";
import { LocalDockerPanel } from "@/widgets/localDocker";
import { ServerList } from "@/widgets/serverList";
import { SummaryStats } from "@/widgets/summaryStats";
import { DashboardHeader } from "@/widgets/dashboardHeader";
import { useMonitorShellContext } from "@/widgets/monitorShell";

export function DashboardPage() {
	const navigate = useNavigate();
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
				hasActiveFilter={false}
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
				servers={pinnedItems.sortServers(filteredServers)}
			/>
		</>
	);
}
