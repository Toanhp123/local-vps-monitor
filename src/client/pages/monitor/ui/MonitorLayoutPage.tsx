import { useState } from "react";
import { Outlet, useMatch, useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useHttpCheckManager } from "../../../features/httpChecks/model/useHttpCheckManager";
import { useLocalDockerScanner } from "../../../features/localDockerScan/model/useLocalDockerScanner";
import { useMonitorOverview } from "../../../features/monitorOverview/model/useMonitorOverview";
import { useSshTargetManager } from "../../../features/sshTargetManagement/model/useSshTargetManager";
import { routes } from "../../../shared/config/routes";
import { useNow } from "../../../shared/lib/useNow";
import { Toast } from "../../../shared/ui/Toast";
import { DashboardSidebar } from "../../../widgets/dashboardSidebar/ui/DashboardSidebar";
import type { MonitorShellContext } from "../../../widgets/monitorShell/model/useMonitorShellContext";

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
	} = useMonitorOverview();
	const httpCheckManager = useHttpCheckManager(loadOverview);
	const localDockerScanner = useLocalDockerScanner(loadOverview);
	const sshTargetManager = useSshTargetManager(loadOverview);
	const serverDetailMatch = useMatch("/servers/:serverId");
	const httpChecksMatch = useMatch(routes.httpChecks);
	const sshTargetsMatch = useMatch(routes.sshTargets);
	const selectedServerId = serverDetailMatch?.params.serverId;
	const selectedServer = selectedServerId
		? overview?.servers.find((server) => server.serverId === selectedServerId) ||
			null
		: null;
	const activeScanId = localDockerScanner.activeScanSource === "server-list"
		? localDockerScanner.serverId
		: sshTargetManager.activeScanSource === "server-list"
			? sshTargetManager.activeScanId
			: null;
	const isAnyScanActive =
		isScanAllActive ||
		localDockerScanner.isScanning ||
		Boolean(sshTargetManager.activeScanId);

	const activeSection = serverDetailMatch
		? "server-detail"
		: httpChecksMatch
			? "http-checks"
			: sshTargetsMatch
				? "ssh-targets"
				: "dashboard";
	const openDashboard = () => {
		navigate(routes.dashboard);
		window.scrollTo({ top: 0 });
	};
	const openHttpChecks = () => {
		navigate(routes.httpChecks);
		window.scrollTo({ top: 0 });
	};
	const openSshTargets = () => {
		navigate(routes.sshTargets);
		window.scrollTo({ top: 0 });
	};

	const handleScanServer = (serverId: string) => {
		if (isAnyScanActive) return;

		if (serverId === localDockerScanner.serverId) {
			void localDockerScanner.scanFrom("server-list");
			return;
		}

		void sshTargetManager.scanTarget(serverId, "server-list");
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

	const context: MonitorShellContext = {
		activeScanId,
		filteredServers,
		handleScanAll,
		handleScanServer,
		httpCheckManager,
		isAnyScanActive,
		isScanAllActive,
		localDockerScanner,
		now,
		overview,
		query,
		setQuery,
		sshTargetManager,
	};

	return (
		<div className="flex min-h-screen bg-[#eef1f5] text-slate-900 antialiased max-lg:flex-col">
			<DashboardSidebar
				activeSection={activeSection}
				httpCheckCount={httpCheckManager.checks.length}
				onDashboardOpen={openDashboard}
				onHttpChecksOpen={openHttpChecks}
				onSshTargetsOpen={openSshTargets}
				overview={overview}
				realtimeStatus={realtimeStatus}
				selectedServer={selectedServer}
				sshTargetCount={sshTargetManager.targets.length}
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
			<Toast
				toast={
					localDockerScanner.toast ||
					sshTargetManager.toast ||
					httpCheckManager.toast
				}
			/>
		</div>
	);
}
