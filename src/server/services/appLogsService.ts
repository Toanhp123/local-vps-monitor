import type { AppKind, AppLogsResponse, AppSnapshot } from "../../shared/types";
import { readLocalDockerLogs } from "../integrations/local/localDockerLogsReader";
import { connectSshTarget } from "../integrations/ssh/sshCommandRunner";
import { readSshAppLogs } from "../integrations/ssh/sshAppLogsReader";
import type { SshTargetConfigStore } from "../models/sshTargetConfigStore";
import { localDockerServerId } from "./localDockerScanService";
import type { MonitorOverviewService } from "./monitorOverviewService";

const minLines = 10;
const maxLines = 1000;
const defaultLines = 200;

const clampLines = (value: number) => {
	if (!Number.isFinite(value)) return defaultLines;
	return Math.min(maxLines, Math.max(minLines, Math.round(value)));
};

const dockerContainerRef = (app: AppSnapshot) => {
	const rawDockerId = app.raw?.dockerId;
	if (typeof rawDockerId === "string" && rawDockerId.trim()) {
		return rawDockerId.trim();
	}

	return app.id.replace(/^docker:/, "");
};

export class AppLogsNotFoundError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AppLogsNotFoundError";
	}
}

export class AppLogsUnsupportedError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AppLogsUnsupportedError";
	}
}

export class AppLogsService {
	constructor(
		private readonly monitorOverviewService: MonitorOverviewService,
		private readonly targetConfigStore: SshTargetConfigStore,
		private readonly localDockerCommandTimeoutMs: number,
		private readonly sshCommandTimeoutMs: number,
	) {}

	async getAppLogs({
		appId,
		lines,
		serverId,
	}: {
		appId: string;
		lines: number;
		serverId: string;
	}): Promise<AppLogsResponse> {
		const normalizedLines = clampLines(lines);
		const server = this.monitorOverviewService.getServer(serverId);
		if (!server) {
			throw new AppLogsNotFoundError(`Server not found: ${serverId}`);
		}

		const app = server.apps.find((item) => item.id === appId);
		if (!app) {
			throw new AppLogsNotFoundError(`App not found: ${appId}`);
		}

		const content = await this.readLogs(serverId, app, normalizedLines);

		return {
			appId: app.id,
			appName: app.name,
			content,
			fetchedAt: new Date().toISOString(),
			kind: app.kind,
			lines: normalizedLines,
			serverId,
		};
	}

	private async readLogs(
		serverId: string,
		app: AppSnapshot,
		lines: number,
	) {
		if (serverId === localDockerServerId) {
			return this.readLocalLogs(app, lines);
		}

		return this.readSshLogs(serverId, app, lines);
	}

	private async readLocalLogs(app: AppSnapshot, lines: number) {
		if (app.kind !== "docker") {
			throw new AppLogsUnsupportedError(
				"Local logs are only supported for Docker apps.",
			);
		}

		return readLocalDockerLogs(
			dockerContainerRef(app),
			lines,
			this.localDockerCommandTimeoutMs,
		);
	}

	private async readSshLogs(serverId: string, app: AppSnapshot, lines: number) {
		const target = this.targetConfigStore.get(serverId);
		if (!target) {
			throw new AppLogsNotFoundError(`SSH target not found: ${serverId}`);
		}

		if (!this.isSupportedRemoteKind(app.kind)) {
			throw new AppLogsUnsupportedError(`Unsupported app runtime: ${app.kind}`);
		}

		const client = await connectSshTarget(target, this.sshCommandTimeoutMs);

		try {
			return await readSshAppLogs(
				client,
				app,
				lines,
				this.sshCommandTimeoutMs,
			);
		} finally {
			client.end();
		}
	}

	private isSupportedRemoteKind(kind: AppKind) {
		return kind === "docker" || kind === "pm2";
	}
}
