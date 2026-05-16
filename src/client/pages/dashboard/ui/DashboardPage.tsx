import { useNavigate } from "react-router-dom";
import { routes } from "../../../shared/config/routes";
import { LocalDockerPanel } from "../../../widgets/localDocker/ui/LocalDockerPanel";
import { ServerList } from "../../../widgets/serverList/ui/ServerList";
import { SummaryStats } from "../../../widgets/summaryStats/ui/SummaryStats";
import { DashboardHeader } from "../../../widgets/dashboardHeader/ui/DashboardHeader";
import { useMonitorShellContext } from "../../../widgets/monitorShell/model/useMonitorShellContext";

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
				hasActiveFilter={false}
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
