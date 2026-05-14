import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useDashboardOverview } from "../model/useDashboardOverview";
import { useLocalDockerScanner } from "../model/useLocalDockerScanner";
import { useSshTargetManager } from "../model/useSshTargetManager";
import { DashboardHeader } from "../../../widgets/dashboardHeader/ui/DashboardHeader";
import { DashboardSidebar } from "../../../widgets/dashboardSidebar/ui/DashboardSidebar";
import { LocalDockerPanel } from "../../../widgets/localDocker/ui/LocalDockerPanel";
import { ServerList } from "../../../widgets/serverList/ui/ServerList";
import { SshTargetManagerPanel } from "../../../widgets/sshTargets/ui/SshTargetManagerPanel";
import { SummaryStats } from "../../../widgets/summaryStats/ui/SummaryStats";
import { useNow } from "../../../shared/lib/useNow";
import { Toast } from "../../../shared/ui/Toast";

export function DashboardPage() {
	const now = useNow();
	const [isScanAllActive, setIsScanAllActive] = useState(false);
	const {
		filteredServers,
		loadOverview,
		overview,
		query,
		realtimeStatus,
		requestStatus,
		setQuery,
		setViewFilter,
		viewFilter,
	} = useDashboardOverview();
	const localDockerScanner = useLocalDockerScanner(loadOverview);
	const sshTargetManager = useSshTargetManager(loadOverview);
	const activeScanId = localDockerScanner.isScanning
		? localDockerScanner.serverId
		: sshTargetManager.activeScanId;
	const isSshScanAllActive =
		sshTargetManager.activeScanId === sshTargetManager.scanAllId;
	const isAnyScanActive =
		isScanAllActive ||
		localDockerScanner.isScanning ||
		Boolean(sshTargetManager.activeScanId);
	const handleScanServer = (serverId: string) => {
		if (isAnyScanActive) return;

		if (serverId === localDockerScanner.serverId) {
			void localDockerScanner.scan();
			return;
		}

		void sshTargetManager.scanTarget(serverId);
	};
	const handleScanAll = () => {
		if (isAnyScanActive) return;

		setIsScanAllActive(true);
		void Promise.allSettled([
			localDockerScanner.scanInBackground(),
			sshTargetManager.targets.length > 0
				? sshTargetManager.scanAllTargets()
				: Promise.resolve(),
		]).finally(() => {
			setIsScanAllActive(false);
		});
	};

	return (
		<div className="flex min-h-screen bg-[#eef1f5] text-slate-900 antialiased max-lg:flex-col">
			<DashboardSidebar
				activeFilter={viewFilter}
				onFilterChange={setViewFilter}
				overview={overview}
				realtimeStatus={realtimeStatus}
			/>

			<main className="min-w-0 flex-1">
				<div className="mx-auto max-w-360 p-7 max-md:p-4.5">
					<DashboardHeader
						isScanAllDisabled={isAnyScanActive}
						isScanningAll={isScanAllActive}
						onScanAll={handleScanAll}
						query={query}
						onQueryChange={setQuery}
					/>

					{requestStatus === "error" && (
						<div className="mb-4 flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 font-bold text-rose-800">
							<AlertTriangle size={18} />
							API is not reachable
						</div>
					)}

					<SummaryStats overview={overview} />
					<LocalDockerPanel
						error={localDockerScanner.error}
						isScanDisabled={isAnyScanActive}
						isScanning={localDockerScanner.isScanning}
						onScan={localDockerScanner.scan}
					/>
					<SshTargetManagerPanel
						activeScanId={activeScanId}
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
						onScanServer={handleScanServer}
						query={query}
						servers={filteredServers}
					/>
				</div>
			</main>
			<Toast toast={localDockerScanner.toast || sshTargetManager.toast} />
		</div>
	);
}
