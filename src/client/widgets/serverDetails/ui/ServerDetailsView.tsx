import type {
	AppPolicyOverrideInput,
	AppSnapshot,
	MonitorRuntimeSettings,
	MonitorRuntimeSettingsUpdateInput,
	ServerAlertPolicy,
	ServerAlertPolicyUpdateInput,
	ServerHistoricalMetricPoint,
	ServerMetricHistoryRange,
	StoredServer,
} from "@shared/types";
import { ServerMetricCharts } from "@/entities/server";
import { ServerMetricsGrid } from "@/entities/server";
import type { usePinnedItems } from "@/features/pinnedItems";
import type { QuickActionDefinition } from "@/features/quickActions";
import { ApplicationGroupsSection } from "./ApplicationGroupsSection";
import { ServerDetailsHeader } from "./ServerDetailsHeader";

export function ServerDetailsView({
	activeAppPolicyKey,
	alertPolicy,
	alertPolicyError,
	isAlertPolicyLoading,
	isMonitorRuntimeLoading,
	isScanDisabled,
	isSavingAppPolicy,
	isSavingAlertPolicy,
	isSavingMonitorRuntime,
	isScanning,
	metricHistory,
	metricHistoryError,
	metricHistoryIsLoading,
	metricHistoryRange,
	monitorRuntimeError,
	monitorRuntimeSettings,
	now,
	onBack,
	onMetricHistoryRangeChange,
	onOpenAppLogs,
	onRunQuickAction,
	onSaveAlertPolicy,
	onSaveMonitorRuntime,
	onUpdateAppPolicy,
	onScan,
	pinnedItems,
	server,
}: {
	activeAppPolicyKey: string | null;
	alertPolicy: ServerAlertPolicy | null;
	alertPolicyError: string;
	isAlertPolicyLoading: boolean;
	isMonitorRuntimeLoading: boolean;
	isScanDisabled: boolean;
	isSavingAppPolicy: boolean;
	isSavingAlertPolicy: boolean;
	isSavingMonitorRuntime: boolean;
	isScanning: boolean;
	metricHistory: ServerHistoricalMetricPoint[];
	metricHistoryError: string;
	metricHistoryIsLoading: boolean;
	metricHistoryRange: ServerMetricHistoryRange;
	monitorRuntimeError: string;
	monitorRuntimeSettings: MonitorRuntimeSettings | null;
	now: number;
	onBack: () => void;
	onMetricHistoryRangeChange: (range: ServerMetricHistoryRange) => void;
	onOpenAppLogs: (app: AppSnapshot) => void;
	onRunQuickAction: (action: QuickActionDefinition) => void;
	onSaveAlertPolicy: (input: ServerAlertPolicyUpdateInput) => Promise<boolean>;
	onSaveMonitorRuntime: (
		input: MonitorRuntimeSettingsUpdateInput,
	) => Promise<boolean>;
	onUpdateAppPolicy: (input: AppPolicyOverrideInput) => Promise<boolean>;
	onScan: () => void;
	pinnedItems: ReturnType<typeof usePinnedItems>;
	server: StoredServer;
}) {
	return (
		<section className="grid gap-4">
			<ServerDetailsHeader
				alertPolicy={alertPolicy}
				alertPolicyError={alertPolicyError}
				isAlertPolicyLoading={isAlertPolicyLoading}
				isMonitorRuntimeLoading={isMonitorRuntimeLoading}
				isScanDisabled={isScanDisabled}
				isSavingAlertPolicy={isSavingAlertPolicy}
				isSavingMonitorRuntime={isSavingMonitorRuntime}
				isScanning={isScanning}
				monitorRuntimeError={monitorRuntimeError}
				monitorRuntimeSettings={monitorRuntimeSettings}
				now={now}
				onBack={onBack}
				onRunQuickAction={onRunQuickAction}
				onSaveAlertPolicy={onSaveAlertPolicy}
				onSaveMonitorRuntime={onSaveMonitorRuntime}
				onScan={onScan}
				server={server}
			/>

			<div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
				<ServerMetricsGrid server={server} />
				<ServerMetricCharts
					error={metricHistoryError}
					history={metricHistory}
					isLoading={metricHistoryIsLoading}
					onRangeChange={onMetricHistoryRangeChange}
					range={metricHistoryRange}
				/>

				<ApplicationGroupsSection
					activeAppPolicyKey={activeAppPolicyKey}
					isSavingAppPolicy={isSavingAppPolicy}
					onOpenAppLogs={onOpenAppLogs}
					onRunQuickAction={onRunQuickAction}
					onUpdateAppPolicy={onUpdateAppPolicy}
					pinnedItems={pinnedItems}
					server={server}
				/>
			</div>
		</section>
	);
}
