import { useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAppLogs } from "../../../features/appLogs/model/useAppLogs";
import { AppLogsPanel } from "../../../features/appLogs/ui/AppLogsPanel";
import { useQuickActionRunner } from "../../../features/quickActions/model/useQuickActionRunner";
import { QuickActionPanel } from "../../../features/quickActions/ui/QuickActionPanel";
import { routes } from "../../../shared/config/routes";
import { ServerDetailsView } from "../../../widgets/serverDetails/ui/ServerDetailsView";
import { useMonitorShellContext } from "../../../widgets/monitorShell/model/useMonitorShellContext";

export function ServerDetailsPage() {
	const navigate = useNavigate();
	const { serverId } = useParams<{ serverId: string }>();
	const {
		activeScanId,
		appMonitoringRules,
		handleScanServer,
		isAnyScanActive,
		now,
		overview,
	} = useMonitorShellContext();
	const selectedServer = serverId
		? overview?.servers.find((server) => server.serverId === serverId) ||
			null
		: null;
	const appLogs = useAppLogs(serverId || "");
	const quickActions = useQuickActionRunner();

	useEffect(() => {
		if (!serverId || !overview) return;

		if (!selectedServer) {
			navigate(routes.dashboard, { replace: true });
		}
	}, [navigate, overview, selectedServer, serverId]);

	if (!serverId) {
		return <Navigate to={routes.dashboard} replace />;
	}

	if (!selectedServer) {
		return (
			<div className="rounded-lg border border-slate-200 bg-white p-6">
				<span className="text-sm font-bold text-slate-500">
					Loading server details
				</span>
			</div>
		);
	}

	return (
		<>
			<ServerDetailsView
				activeAppPolicyKey={appMonitoringRules.activeAppKey}
				isScanDisabled={isAnyScanActive}
				isSavingAppPolicy={appMonitoringRules.isSaving}
				isScanning={activeScanId === selectedServer.serverId}
				now={now}
				onBack={() => {
					navigate(routes.dashboard);
					window.scrollTo({ top: 0 });
				}}
				onOpenAppLogs={appLogs.loadLogs}
				onRunQuickAction={quickActions.requestAction}
				onUpdateAppPolicy={appMonitoringRules.upsertAppOverride}
				onScan={() => handleScanServer(selectedServer.serverId)}
				server={selectedServer}
			/>
			<AppLogsPanel
				app={appLogs.app}
				error={appLogs.error}
				isLoading={appLogs.isLoading}
				isOpen={appLogs.isOpen}
				lineCount={appLogs.lineCount}
				logs={appLogs.logs}
				onClose={appLogs.closeLogs}
				onLineCountChange={appLogs.changeLineCount}
				onRefresh={appLogs.refreshLogs}
			/>
			<QuickActionPanel
				action={quickActions.pendingAction}
				error={quickActions.error}
				isOpen={quickActions.isOpen}
				isRunning={quickActions.isRunning}
				onClose={quickActions.close}
				onConfirm={quickActions.confirmAction}
				result={quickActions.result}
			/>
		</>
	);
}
