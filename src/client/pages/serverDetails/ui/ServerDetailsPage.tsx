import { useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAppLogs } from "@/features/appLogs";
import { AppLogsPanel } from "@/features/appLogs";
import { resolveServerMonitorRuntimeSettings } from "@/features/monitorRuntime";
import { useQuickActionRunner } from "@/features/quickActions";
import { QuickActionPanel } from "@/features/quickActions";
import { routes } from "@/shared/config/routes";
import { ServerDetailsView } from "@/widgets/serverDetails";
import { useMonitorShellContext } from "@/widgets/monitorShell";

export function ServerDetailsPage() {
	const navigate = useNavigate();
	const { serverId } = useParams<{ serverId: string }>();
	const {
		activeScanId,
		appPolicies,
		handleScanServer,
		isAnyScanActive,
		now,
		overview,
		pinnedItems,
		monitorRuntime,
		serverAlertPolicy,
	} = useMonitorShellContext();
	const selectedServer = serverId
		? overview?.servers.find((server) => server.serverId === serverId) ||
			null
		: null;
	const serverRuntimeSettings =
		selectedServer && monitorRuntime.settings
			? resolveServerMonitorRuntimeSettings(
					monitorRuntime.settings,
					selectedServer.serverId,
				)
			: null;
	const appLogs = useAppLogs(
		serverId || "",
		serverRuntimeSettings?.defaultAppLogLines ?? 200,
	);
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
				activeAppPolicyKey={appPolicies.activeAppKey}
				isScanDisabled={isAnyScanActive}
				alertPolicy={serverAlertPolicy.policy}
				alertPolicyError={serverAlertPolicy.error}
				isAlertPolicyLoading={serverAlertPolicy.isLoading}
				isMonitorRuntimeLoading={monitorRuntime.isLoading}
				isSavingAppPolicy={appPolicies.isSaving}
				isSavingAlertPolicy={serverAlertPolicy.isSaving}
				isSavingMonitorRuntime={monitorRuntime.isSaving}
				isScanning={activeScanId === selectedServer.serverId}
				monitorRuntimeError={monitorRuntime.error}
				monitorRuntimeSettings={monitorRuntime.settings}
				now={now}
				onBack={() => {
					navigate(routes.dashboard);
					window.scrollTo({ top: 0 });
				}}
				onOpenAppLogs={appLogs.loadLogs}
				onRunQuickAction={quickActions.requestAction}
				onSaveAlertPolicy={serverAlertPolicy.savePolicy}
				onSaveMonitorRuntime={monitorRuntime.saveSettings}
				onUpdateAppPolicy={appPolicies.upsertAppOverride}
				onScan={() => handleScanServer(selectedServer.serverId)}
				pinnedItems={pinnedItems}
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
