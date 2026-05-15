import type {
	AppSnapshot,
	QuickActionId,
	QuickActionRunInput,
	StoredServer,
} from "../../../../shared/types";

const localDockerServerId = "local-docker";

export interface QuickActionDefinition extends QuickActionRunInput {
	commandPreview: string;
	description: string;
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
	if (app.kind === "docker") {
		const containerRef = dockerContainerRef(app);

		return [
			{
				actionId: "docker.restart",
				appId: app.id,
				commandPreview: `docker restart ${shellQuote(containerRef)}`,
				description: `Restart ${app.name}.`,
				label: "Restart",
				requiresConfirmation: true,
				serverId: server.serverId,
				tone: "danger",
			},
		];
	}

	if (app.kind === "pm2" && server.serverId !== localDockerServerId) {
		const processRef = pm2ProcessRef(app);

		return [
			{
				actionId: "pm2.restart",
				appId: app.id,
				commandPreview: `pm2 restart ${shellQuote(processRef)}`,
				description: `Restart ${app.name}.`,
				label: "Restart",
				requiresConfirmation: true,
				serverId: server.serverId,
				tone: "danger",
			},
		];
	}

	return [];
};
