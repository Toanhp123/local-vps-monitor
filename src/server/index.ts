import { createServer } from "node:http";
import { createApp } from "./app";
import { serverConfig } from "./config";
import { OverviewWebSocketGateway } from "./realtime/overviewWebSocketGateway";
import { AutoScanScheduler } from "./services/autoScanScheduler";

const {
	app,
	httpCheckService,
	localDockerScanService,
	monitorOverviewService,
	services,
	sshScanService,
} = createApp();
const httpServer = createServer(app);
const monitorRuntime = services.monitorRuntimeService.getSettings();
const autoScanScheduler = new AutoScanScheduler(
	sshScanService,
	localDockerScanService,
	httpCheckService,
	(serverId) =>
		services.monitorRuntimeService.getServerSettings(serverId)
			.autoScanIntervalMs,
	monitorRuntime.autoScanIntervalMs,
);

const overviewWebSocketGateway = new OverviewWebSocketGateway(
	httpServer,
	monitorOverviewService,
	monitorRuntime.realtimeBroadcastMs,
);
const unsubscribeMonitorRuntimeSettings =
	services.monitorRuntimeService.onSettingsUpdated((settings) => {
		autoScanScheduler.updateInterval(settings.autoScanIntervalMs);
		overviewWebSocketGateway.updateBroadcastInterval(
			settings.realtimeBroadcastMs,
		);
	});

httpServer.listen(serverConfig.port, serverConfig.host, () => {
	console.log(
		`VPS Monitor API listening on http://${serverConfig.host}:${serverConfig.port}`,
	);
	console.log(
		`VPS Monitor WebSocket listening on ws://${serverConfig.host}:${serverConfig.port}/ws`,
	);

	console.log(
		`VPS Monitor default auto scan interval: ${monitorRuntime.autoScanIntervalMs}ms`,
	);
	autoScanScheduler.start();
});

const shutdown = () => {
	unsubscribeMonitorRuntimeSettings();
	autoScanScheduler.stop();
	httpServer.close(() => {
		process.exit(0);
	});
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
