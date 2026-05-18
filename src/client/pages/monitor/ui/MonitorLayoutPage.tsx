import { useState } from "react";
import { Outlet, useMatch, useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useServerAlertPolicy } from "@/features/serverAlertPolicy";
import { useAppPolicies } from "@/features/appPolicies";
import { useHttpCheckManager } from "@/features/httpChecks";
import { useLocalDockerScanner } from "@/features/localDockerScan";
import { useMonitorOverview } from "@/features/monitorOverview";
import { usePinnedItems } from "@/features/pinnedItems";
import { useSshTargetManager } from "@/features/sshTargetManagement";
import { useMonitorRuntime } from "@/features/monitorRuntime";
import { useDataRetention } from "@/features/dataRetention";
import { routes } from "@/shared/config/routes";
import { useNow } from "@/shared/lib/useNow";
import { Toast } from "@/shared/ui/Toast";
import { DashboardSidebar } from "@/widgets/dashboardSidebar";
import type { MonitorShellContext } from "@/widgets/monitorShell";

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
	const serverAlertPolicy = useServerAlertPolicy(loadOverview);
	const appPolicies = useAppPolicies(loadOverview);
	const httpCheckManager = useHttpCheckManager(loadOverview);
	const localDockerScanner = useLocalDockerScanner(loadOverview);
	const pinnedItems = usePinnedItems();
	const sshTargetManager = useSshTargetManager(loadOverview);
	const monitorRuntime = useMonitorRuntime(loadOverview);
	const dataRetention = useDataRetention();
	const serverDetailMatch = useMatch("/servers/:serverId");
	const httpChecksMatch = useMatch(routes.httpChecks);
	const settingsMatch = useMatch(routes.settings);
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
			: settingsMatch
				? "settings"
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
	const openSettings = () => {
		navigate(routes.settings);
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
		appPolicies,
		dataRetention,
		filteredServers,
		handleScanAll,
		handleScanServer,
		httpCheckManager,
		isAnyScanActive,
		isScanAllActive,
		localDockerScanner,
		now,
		overview,
		pinnedItems,
		query,
		serverAlertPolicy,
		setQuery,
		sshTargetManager,
		monitorRuntime,
	};

	return (
		<div className="flex min-h-screen bg-[#eef1f5] text-slate-900 antialiased max-lg:flex-col">
			<DashboardSidebar
				activeSection={activeSection}
				httpCheckCount={httpCheckManager.checks.length}
				onDashboardOpen={openDashboard}
				onHttpChecksOpen={openHttpChecks}
				onSettingsOpen={openSettings}
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
					appPolicies.toast ||
					serverAlertPolicy.toast ||
					httpCheckManager.toast ||
					monitorRuntime.toast ||
					dataRetention.toast
				}
			/>
		</div>
	);
}
