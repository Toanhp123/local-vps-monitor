import { useNavigate } from "react-router-dom";
import { routes } from "../../../shared/config/routes";
import { LocalDockerPanel } from "../../../widgets/localDocker/ui/LocalDockerPanel";
import { ServerList } from "../../../widgets/serverList/ui/ServerList";
import { SshTargetManagerPanel } from "../../../widgets/sshTargets/ui/SshTargetManagerPanel";
import { SummaryStats } from "../../../widgets/summaryStats/ui/SummaryStats";
import { DashboardHeader } from "../../../widgets/dashboardHeader/ui/DashboardHeader";
import { useMonitorPageContext } from "../../monitor/model/useMonitorPageContext";

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
		now,
		overview,
		query,
		setQuery,
		sshTargetManager,
		viewFilter,
	} = useMonitorPageContext();

	const openServerDetail = (serverId: string) => {
		navigate(routes.serverDetail(serverId));
		window.scrollTo({ top: 0 });
	};
	const activeSshTargetScanId =
		sshTargetManager.activeScanSource === "targets-panel"
			? sshTargetManager.activeScanId
			: null;

	return (
		<>
			<DashboardHeader
				isScanAllDisabled={isAnyScanActive}
				isScanningAll={isScanAllActive}
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
			<SshTargetManagerPanel
				activeScanId={activeSshTargetScanId}
				error={sshTargetManager.error}
				isScanDisabled={isAnyScanActive}
				isLoading={sshTargetManager.isLoading}
				isSaving={sshTargetManager.isSaving}
				onAddTarget={sshTargetManager.addTarget}
				onRemoveTarget={sshTargetManager.removeTarget}
				onScanTarget={sshTargetManager.scanTarget}
				targets={sshTargetManager.targets}
			/>
			<ServerList
				activeScanId={activeScanId}
				hasActiveFilter={viewFilter !== "all"}
				isScanDisabled={isAnyScanActive}
				now={now}
				onOpenServer={openServerDetail}
				onScanServer={handleScanServer}
				query={query}
				servers={filteredServers}
			/>
		</>
	);
}
