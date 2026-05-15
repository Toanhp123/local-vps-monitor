import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useLocalDockerScanner } from "../../../features/localDockerScan/model/useLocalDockerScanner";
import { useSshTargetManager } from "../../../features/sshTargetManagement/model/useSshTargetManager";
import { routes } from "../../../shared/config/routes";
import { useNow } from "../../../shared/lib/useNow";
import { Toast } from "../../../shared/ui/Toast";
import { DashboardSidebar } from "../../../widgets/dashboardSidebar/ui/DashboardSidebar";
import { useMonitorOverview } from "../model/useMonitorOverview";
import type { MonitorPageContext } from "../model/useMonitorPageContext";

export function MonitorLayoutPage() {
	const now = useNow();
	const navigate = useNavigate();
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
	} = useMonitorOverview();
	const localDockerScanner = useLocalDockerScanner(loadOverview);
	const sshTargetManager = useSshTargetManager(loadOverview);
	const activeScanId = localDockerScanner.activeScanSource === "server-list"
		? localDockerScanner.serverId
		: sshTargetManager.activeScanId;
	const isAnyScanActive =
		isScanAllActive ||
		localDockerScanner.isScanning ||
		Boolean(sshTargetManager.activeScanId);

	const handleFilterChange = (nextFilter: typeof viewFilter) => {
		setViewFilter(nextFilter);
		navigate(routes.dashboard);
		window.scrollTo({ top: 0 });
	};

	const handleScanServer = (serverId: string) => {
		if (isAnyScanActive) return;

		if (serverId === localDockerScanner.serverId) {
			void localDockerScanner.scanFrom("server-list");
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

	const context: MonitorPageContext = {
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
	};

	return (
		<div className="flex min-h-screen bg-[#eef1f5] text-slate-900 antialiased max-lg:flex-col">
			<DashboardSidebar
				activeFilter={viewFilter}
				onFilterChange={handleFilterChange}
				overview={overview}
				realtimeStatus={realtimeStatus}
			/>

			<main className="min-w-0 flex-1">
				<div className="mx-auto max-w-360 p-7 max-md:p-4.5">
					{requestStatus === "error" && (
						<div className="mb-4 flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 font-bold text-rose-800">
							<AlertTriangle size={18} />
							API is not reachable
						</div>
					)}

					<Outlet context={context} />
				</div>
			</main>
			<Toast toast={localDockerScanner.toast || sshTargetManager.toast} />
		</div>
	);
}
