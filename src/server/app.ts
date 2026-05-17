import express, { type Express } from "express";
import fs from "node:fs";
import path from "node:path";
import { createServerServices, type ServerServices } from "./container";
import { apiErrorHandler } from "./middleware/apiErrorHandler";
import { localAccessGuard } from "./middleware/localAccessGuard";
import { createApiRouter } from "./routes/apiRoutes";
import type { LocalDockerScanService } from "./services/localDockerScanService";
import type { MonitorOverviewService } from "./services/monitorOverviewService";
import type { SshScanService } from "./services/sshScanService";
import type { HttpCheckService } from "./services/httpCheckService";

const mountClientApp = (app: Express) => {
	const clientDist = path.resolve(process.cwd(), "dist/client");
	const indexHtml = path.join(clientDist, "index.html");

	if (!fs.existsSync(indexHtml)) return;

	app.use(express.static(clientDist));
	app.use((request, response, next) => {
		if (request.path.startsWith("/api")) {
			next();
			return;
		}

		response.sendFile(indexHtml);
	});
};

export interface ServerAppContext {
	app: Express;
	httpCheckService: HttpCheckService;
	localDockerScanService: LocalDockerScanService;
	monitorOverviewService: MonitorOverviewService;
	services: ServerServices;
	sshScanService: SshScanService;
}

export const createApp = (services = createServerServices()) => {
	const app = express();

	app.use(localAccessGuard());
	app.use(express.json({ limit: "1mb" }));
	app.use(
		"/api",
		createApiRouter({
			serverAlertPolicyService: services.serverAlertPolicyService,
			appPolicyService: services.appPolicyService,
			appLogsService: services.appLogsService,
			healthService: services.healthService,
			httpCheckService: services.httpCheckService,
			incidentStateService: services.incidentStateService,
			localDockerScanService: services.localDockerScanService,
			monitorOverviewService: services.monitorOverviewService,
			quickActionService: services.quickActionService,
			sshScanService: services.sshScanService,
			sshTargetBootstrapService: services.sshTargetBootstrapService,
			sshTargetConfigService: services.sshTargetConfigService,
			sshTargetImportService: services.sshTargetImportService,
			monitorRuntimeService: services.monitorRuntimeService,
		}),
	);
	app.use("/api", apiErrorHandler());

	mountClientApp(app);

	return {
		app,
		httpCheckService: services.httpCheckService,
		localDockerScanService: services.localDockerScanService,
		monitorOverviewService: services.monitorOverviewService,
		services,
		sshScanService: services.sshScanService,
	} satisfies ServerAppContext;
};
