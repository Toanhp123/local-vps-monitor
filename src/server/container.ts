import { serverConfig } from "./config";
import { ServerAlertPolicyService } from "./services/serverAlertPolicyService";
import { AppPolicyService } from "./services/appPolicyService";
import { AppLogsService } from "./services/appLogsService";
import { HealthService } from "./services/healthService";
import { HttpCheckService } from "./services/httpCheckService";
import { IncidentStateService } from "./services/incidentStateService";
import { LocalDockerScanService } from "./services/localDockerScanService";
import { MonitorOverviewService } from "./services/monitorOverviewService";
import { QuickActionService } from "./services/quickActionService";
import { SshScanService } from "./services/sshScanService";
import { SshTargetBootstrapService } from "./services/sshTargetBootstrapService";
import { SshTargetConfigService } from "./services/sshTargetConfigService";
import { SshTargetImportService } from "./services/sshTargetImportService";
import { MonitorRuntimeService } from "./services/monitorRuntimeService";
import { DatabaseService } from "./services/databaseService";
import { ServerAlertPolicyStore } from "./stores/serverAlertPolicyStore";
import { AppPolicyStore } from "./stores/appPolicyStore";
import { MonitorStateStore } from "./stores/monitorStateStore";
import { HttpCheckConfigStore } from "./stores/httpCheckConfigStore";
import { IncidentStateStore } from "./stores/incidentStateStore";
import { SshTargetConfigStore } from "./stores/sshTargetConfigStore";
import { MonitorRuntimeStore } from "./stores/monitorRuntimeStore";
import { DatabaseStore } from "./stores/databaseStore";

export interface ServerServices {
	serverAlertPolicyService: ServerAlertPolicyService;
	appPolicyService: AppPolicyService;
	appLogsService: AppLogsService;
	healthService: HealthService;
	httpCheckService: HttpCheckService;
	incidentStateService: IncidentStateService;
	localDockerScanService: LocalDockerScanService;
	monitorOverviewService: MonitorOverviewService;
	quickActionService: QuickActionService;
	sshScanService: SshScanService;
	sshTargetBootstrapService: SshTargetBootstrapService;
	sshTargetConfigService: SshTargetConfigService;
	sshTargetImportService: SshTargetImportService;
	monitorRuntimeService: MonitorRuntimeService;
	databaseService: DatabaseService;
}

export const createServerServices = (): ServerServices => {
	const defaultMonitorRuntimeSettings = {
		autoScanIntervalMs: serverConfig.autoScanIntervalMs,
		defaultAppLogLines: serverConfig.defaultAppLogLines,
		httpCheckConcurrency: serverConfig.httpCheckConcurrency,
		incidentHistoryLimit: serverConfig.incidentHistoryLimit,
		localDockerCommandTimeoutMs:
			serverConfig.localDockerCommandTimeoutMs,
		metricHistoryLimit: serverConfig.metricHistoryLimit,
		offlineAfterMs: serverConfig.offlineAfterMs,
		realtimeBroadcastMs: serverConfig.realtimeBroadcastMs,
		serverOverrides: {},
		sshCommandTimeoutMs: serverConfig.sshCommandTimeoutMs,
		sshScanConcurrency: serverConfig.sshScanConcurrency,
	};
	const monitorStateStore = new MonitorStateStore(serverConfig.dataFile);
	const monitorRuntimeStore = new MonitorRuntimeStore(
		serverConfig.monitorRuntimeFile,
		defaultMonitorRuntimeSettings,
	);
	const serverAlertPolicyStore = new ServerAlertPolicyStore(
		serverConfig.serverAlertPolicyFile,
	);
	const appPolicyStore = new AppPolicyStore(
		serverConfig.appPoliciesFile,
	);
	const incidentStateStore = new IncidentStateStore(
		serverConfig.incidentStateFile,
	);
	const sshTargetConfigStore = new SshTargetConfigStore(
		serverConfig.sshTargetsFile,
	);
	const httpCheckConfigStore = new HttpCheckConfigStore(
		serverConfig.httpChecksFile,
	);
	const databaseStore = new DatabaseStore({
		databasePath: serverConfig.databaseFile,
	});
	const databaseService = new DatabaseService(databaseStore, {
		dataRetentionEnabled: serverConfig.dataRetentionEnabled,
		incidentsRetentionDays: serverConfig.incidentsRetentionDays,
		metricsRetentionDays: serverConfig.metricsRetentionDays,
	});
	const monitorOverviewService = new MonitorOverviewService(
		monitorStateStore,
		(serverId) => monitorRuntimeStore.getServerSettings(serverId).offlineAfterMs,
		() => appPolicyStore.list(),
		() => serverAlertPolicyStore.get(),
		() => monitorRuntimeStore.get().metricHistoryLimit,
		() => monitorRuntimeStore.get().incidentHistoryLimit,
		{
			recordIncident: (incident) => databaseService.addIncident(incident),
			recordServerMetric: (server, payload, metric) =>
				databaseService.recordServerMetric(server, payload, metric),
		},
	);
	const monitorRuntimeService = new MonitorRuntimeService(
		monitorRuntimeStore,
		monitorOverviewService,
	);
	const serverAlertPolicyService = new ServerAlertPolicyService(
		serverAlertPolicyStore,
		monitorOverviewService,
	);
	const appPolicyService = new AppPolicyService(
		appPolicyStore,
		monitorOverviewService,
	);
	const incidentStateService = new IncidentStateService(
		incidentStateStore,
	);
	const localDockerScanService = new LocalDockerScanService(
		monitorOverviewService,
		(serverId) =>
			monitorRuntimeStore.getServerSettings(serverId)
				.localDockerCommandTimeoutMs,
		serverConfig.version,
	);
	const sshTargetConfigService = new SshTargetConfigService(
		sshTargetConfigStore,
	);
	const sshTargetBootstrapService = new SshTargetBootstrapService(
		sshTargetConfigService,
		() => monitorRuntimeStore.get().sshCommandTimeoutMs,
	);
	const sshTargetImportService = new SshTargetImportService(
		sshTargetConfigService,
		sshTargetBootstrapService,
	);
	const sshScanService = new SshScanService(
		sshTargetConfigStore,
		monitorOverviewService,
		(serverId) =>
			monitorRuntimeStore.getServerSettings(serverId).sshCommandTimeoutMs,
		() => monitorRuntimeStore.get().sshScanConcurrency,
		serverConfig.version,
	);
	const healthService = new HealthService({
		dataFile: serverConfig.dataFile,
		version: serverConfig.version,
	});
	const appLogsService = new AppLogsService(
		monitorOverviewService,
		sshTargetConfigStore,
		(serverId) =>
			monitorRuntimeStore.getServerSettings(serverId)
				.localDockerCommandTimeoutMs,
		(serverId) =>
			monitorRuntimeStore.getServerSettings(serverId).sshCommandTimeoutMs,
		(serverId) =>
			monitorRuntimeStore.getServerSettings(serverId).defaultAppLogLines,
	);
	const quickActionService = new QuickActionService(
		monitorOverviewService,
		sshTargetConfigStore,
		(serverId) =>
			monitorRuntimeStore.getServerSettings(serverId)
				.localDockerCommandTimeoutMs,
		(serverId) =>
			monitorRuntimeStore.getServerSettings(serverId).sshCommandTimeoutMs,
	);
	const httpCheckService = new HttpCheckService(
		httpCheckConfigStore,
		monitorOverviewService,
		() => monitorRuntimeStore.get().httpCheckConcurrency,
	);

	return {
		serverAlertPolicyService,
		appPolicyService,
		appLogsService,
		healthService,
		httpCheckService,
		incidentStateService,
		localDockerScanService,
		monitorOverviewService,
		quickActionService,
		sshScanService,
		sshTargetBootstrapService,
		sshTargetConfigService,
		sshTargetImportService,
		monitorRuntimeService,
		databaseService,
	};
};
