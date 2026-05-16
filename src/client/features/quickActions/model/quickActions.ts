import type {
	AppSnapshot,
	QuickActionId,
	QuickActionRunInput,
	StoredServer,
} from "../../../../shared/types";
import { appDisplayName } from "../../../entities/application/model/appMonitoringPolicy";

const localDockerServerId = "local-docker";

export interface QuickActionDefinition extends QuickActionRunInput {
	commandPreview: string;
	description: string;
	group: "app" | "server";
	label: string;
	requiresConfirmation: boolean;
	tone: "default" | "danger";
}

const shellQuote = (value: string) => {
	return `'${value.replace(/'/g, "'\\''")}'`;
};

const dockerContainerRef = (app: AppSnapshot) => {
	const rawDockerId = app.raw?.dockerId;
	if (typeof rawDockerId === "string" && rawDockerId.trim()) {
		return rawDockerId.trim();
	}

	return app.id.replace(/^docker:/, "");
};

const pm2ProcessRef = (app: AppSnapshot) => {
	const rawPmId = app.raw?.pmId;
	if (typeof rawPmId === "number" && Number.isInteger(rawPmId)) {
		return String(rawPmId);
	}

	if (typeof rawPmId === "string" && rawPmId.trim()) {
		return rawPmId.trim();
	}

	return app.id.replace(/^pm2:/, "");
};

const serverAction = ({
	actionId,
	commandPreview,
	description,
	label,
	serverId,
}: {
	actionId: QuickActionId;
	commandPreview: string;
	description: string;
	label: string;
	serverId: string;
}): QuickActionDefinition => ({
	actionId,
	commandPreview,
	description,
	group: "server",
	label,
	requiresConfirmation: false,
	serverId,
	tone: "default",
});

export const buildServerQuickActions = (
	server: StoredServer,
): QuickActionDefinition[] => {
	if (server.serverId === localDockerServerId) return [];

	return [
		serverAction({
			actionId: "server.disk",
			commandPreview: "df -hT /",
			description: "Show root disk usage on this VPS.",
			label: "Disk",
			serverId: server.serverId,
		}),
		serverAction({
			actionId: "server.memory",
			commandPreview: "free -h",
			description: "Show current memory usage on this VPS.",
			label: "Memory",
			serverId: server.serverId,
		}),
		serverAction({
			actionId: "server.uptime",
			commandPreview: "uptime",
			description: "Show uptime and load average.",
			label: "Uptime",
			serverId: server.serverId,
		}),
		serverAction({
			actionId: "server.ports",
			commandPreview: "ss -tulpen || netstat -tulpen",
			description: "List listening TCP/UDP ports.",
			label: "Ports",
			serverId: server.serverId,
		}),
	];
};

export const buildAppQuickActions = (
	server: StoredServer,
	app: AppSnapshot,
): QuickActionDefinition[] => {
	const appName = appDisplayName(app);

	if (app.kind === "docker") {
		const containerRef = dockerContainerRef(app);
		const dockerAction = ({
			actionId,
			description,
			label,
			tone = "danger",
		}: {
			actionId: "docker.restart" | "docker.start" | "docker.stop";
			description: string;
			label: string;
			tone?: "default" | "danger";
		}): QuickActionDefinition => {
			const dockerSubcommand = actionId.replace("docker.", "");

			return {
				actionId,
				appId: app.id,
				commandPreview: `docker ${dockerSubcommand} ${shellQuote(containerRef)}`,
				description,
				group: "app",
				label,
				requiresConfirmation: true,
				serverId: server.serverId,
				tone,
			};
		};

		return [
			dockerAction({
				actionId: "docker.restart",
				description: `Restart ${appName}.`,
				label: "Restart",
			}),
			dockerAction({
				actionId: "docker.start",
				description: `Start ${appName}.`,
				label: "Start",
				tone: "default",
			}),
			dockerAction({
				actionId: "docker.stop",
				description: `Stop ${appName}.`,
				label: "Stop",
			}),
		];
	}

	if (app.kind === "pm2" && server.serverId !== localDockerServerId) {
		const processRef = pm2ProcessRef(app);
		const pm2Action = ({
			actionId,
			description,
			label,
			tone = "danger",
		}: {
			actionId: "pm2.restart" | "pm2.start" | "pm2.stop";
			description: string;
			label: string;
			tone?: "default" | "danger";
		}): QuickActionDefinition => {
			const pm2Subcommand = actionId.replace("pm2.", "");

			return {
				actionId,
				appId: app.id,
				commandPreview: `pm2 ${pm2Subcommand} ${shellQuote(processRef)}`,
				description,
				group: "app",
				label,
				requiresConfirmation: true,
				serverId: server.serverId,
				tone,
			};
		};

		return [
			pm2Action({
				actionId: "pm2.restart",
				description: `Restart ${appName}.`,
				label: "Restart",
			}),
			pm2Action({
				actionId: "pm2.start",
				description: `Start ${appName}.`,
				label: "Start",
				tone: "default",
			}),
			pm2Action({
				actionId: "pm2.stop",
				description: `Stop ${appName}.`,
				label: "Stop",
			}),
		];
	}

	return [];
};
