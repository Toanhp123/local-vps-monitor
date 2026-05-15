import { serverConfig } from "./config";
import { AppLogsService } from "./services/appLogsService";
import { HealthService } from "./services/healthService";
import { LocalDockerScanService } from "./services/localDockerScanService";
import { MonitorOverviewService } from "./services/monitorOverviewService";
import { QuickActionService } from "./services/quickActionService";
import { SshScanService } from "./services/sshScanService";
import { SshTargetBootstrapService } from "./services/sshTargetBootstrapService";
import { SshTargetConfigService } from "./services/sshTargetConfigService";
import { SshTargetImportService } from "./services/sshTargetImportService";
import { MonitorStateStore } from "./stores/monitorStateStore";
import { SshTargetConfigStore } from "./stores/sshTargetConfigStore";

export interface ServerServices {
	appLogsService: AppLogsService;
	healthService: HealthService;
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
	const sshTargetConfigStore = new SshTargetConfigStore(
		serverConfig.sshTargetsFile,
	);
	const monitorOverviewService = new MonitorOverviewService(
		monitorStateStore,
		serverConfig.offlineAfterMs,
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

	return {
		appLogsService,
		healthService,
		localDockerScanService,
		monitorOverviewService,
		quickActionService,
		sshScanService,
		sshTargetBootstrapService,
		sshTargetConfigService,
		sshTargetImportService,
	};
};
