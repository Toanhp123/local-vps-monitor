import { serverConfig } from "./config";
import { AppMonitorRuleService } from "./services/appMonitorRuleService";
import { AppLogsService } from "./services/appLogsService";
import { HealthService } from "./services/healthService";
import { HttpCheckService } from "./services/httpCheckService";
import { LocalDockerScanService } from "./services/localDockerScanService";
import { MonitorOverviewService } from "./services/monitorOverviewService";
import { QuickActionService } from "./services/quickActionService";
import { SshScanService } from "./services/sshScanService";
import { SshTargetBootstrapService } from "./services/sshTargetBootstrapService";
import { SshTargetConfigService } from "./services/sshTargetConfigService";
import { SshTargetImportService } from "./services/sshTargetImportService";
import { AppMonitorRuleStore } from "./stores/appMonitorRuleStore";
import { MonitorStateStore } from "./stores/monitorStateStore";
import { HttpCheckConfigStore } from "./stores/httpCheckConfigStore";
import { SshTargetConfigStore } from "./stores/sshTargetConfigStore";

export interface ServerServices {
	appMonitorRuleService: AppMonitorRuleService;
	appLogsService: AppLogsService;
	healthService: HealthService;
	httpCheckService: HttpCheckService;
	localDockerScanService: LocalDockerScanService;
	monitorOverviewService: MonitorOverviewService;
	quickActionService: QuickActionService;
	sshScanService: SshScanService;
	sshTargetBootstrapService: SshTargetBootstrapService;
	sshTargetConfigService: SshTargetConfigService;
	sshTargetImportService: SshTargetImportService;
}

export const createServerServices = (): ServerServices => {
	const monitorStateStore = new MonitorStateStore(serverConfig.dataFile);
	const appMonitorRuleStore = new AppMonitorRuleStore(
		serverConfig.appMonitorRulesFile,
	);
	const sshTargetConfigStore = new SshTargetConfigStore(
		serverConfig.sshTargetsFile,
	);
	const httpCheckConfigStore = new HttpCheckConfigStore(
		serverConfig.httpChecksFile,
	);
	const monitorOverviewService = new MonitorOverviewService(
		monitorStateStore,
		serverConfig.offlineAfterMs,
		() => appMonitorRuleStore.list(),
	);
	const appMonitorRuleService = new AppMonitorRuleService(
		appMonitorRuleStore,
		monitorOverviewService,
	);
	const localDockerScanService = new LocalDockerScanService(
		monitorOverviewService,
		serverConfig.localDockerCommandTimeoutMs,
		serverConfig.version,
	);
	const sshTargetConfigService = new SshTargetConfigService(
		sshTargetConfigStore,
	);
	const sshTargetBootstrapService = new SshTargetBootstrapService(
		sshTargetConfigService,
		serverConfig.sshCommandTimeoutMs,
	);
	const sshTargetImportService = new SshTargetImportService(
		sshTargetConfigService,
		sshTargetBootstrapService,
	);
	const sshScanService = new SshScanService(
		sshTargetConfigStore,
		monitorOverviewService,
		serverConfig.sshCommandTimeoutMs,
		serverConfig.sshScanConcurrency,
		serverConfig.version,
	);
	const healthService = new HealthService({
		dataFile: serverConfig.dataFile,
		version: serverConfig.version,
	});
	const appLogsService = new AppLogsService(
		monitorOverviewService,
		sshTargetConfigStore,
		serverConfig.localDockerCommandTimeoutMs,
		serverConfig.sshCommandTimeoutMs,
	);
	const quickActionService = new QuickActionService(
		monitorOverviewService,
		sshTargetConfigStore,
		serverConfig.localDockerCommandTimeoutMs,
		serverConfig.sshCommandTimeoutMs,
	);
	const httpCheckService = new HttpCheckService(
		httpCheckConfigStore,
		monitorOverviewService,
		serverConfig.httpCheckConcurrency,
	);

	return {
		appMonitorRuleService,
		appLogsService,
		healthService,
		httpCheckService,
		localDockerScanService,
		monitorOverviewService,
		quickActionService,
		sshScanService,
		sshTargetBootstrapService,
		sshTargetConfigService,
		sshTargetImportService,
	};
};
