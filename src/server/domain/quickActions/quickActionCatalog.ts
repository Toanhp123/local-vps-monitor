import type { AppSnapshot, QuickActionId } from "../../../shared/types";
import { dockerContainerRef, pm2ProcessRef } from "../applications/appRuntimeRefs";
import { isLocalDockerServer } from "../servers/serverIds";
import { shellQuote } from "../../lib/shellQuote";
import { QuickActionUnsupportedError } from "./quickActionErrors";

type ServerQuickActionId = Extract<QuickActionId, `server.${string}`>;
type DockerQuickActionId = Extract<QuickActionId, `docker.${string}`>;
type Pm2QuickActionId = Extract<QuickActionId, `pm2.${string}`>;

export type QuickActionExecution =
	| {
			args: string[];
			file: string;
			kind: "local";
	  }
	| {
			command: string;
			kind: "remote";
	  };

export interface BuiltQuickAction {
	actionId: QuickActionId;
	appId?: string;
	commandLabel: string;
	commandPreview: string;
	execution: QuickActionExecution;
}

export const quickActionIds = [
	"docker.restart",
	"docker.start",
	"docker.stop",
	"pm2.restart",
	"pm2.start",
	"pm2.stop",
	"server.disk",
	"server.memory",
	"server.ports",
	"server.uptime",
] as const satisfies readonly QuickActionId[];

const quickActionIdSet = new Set<string>(quickActionIds);

export const isQuickActionId = (value: unknown): value is QuickActionId => {
	return typeof value === "string" && quickActionIdSet.has(value);
};

export const quickActionRequiresApp = (actionId: QuickActionId) => {
	return actionId.startsWith("docker.") || actionId.startsWith("pm2.");
};

const serverActions: Record<
	ServerQuickActionId,
	{
		command: string;
		label: string;
	}
> = {
	"server.disk": {
		command: "df -hT /",
		label: "Check disk usage",
	},
	"server.memory": {
		command: "free -h",
		label: "Check memory",
	},
	"server.ports": {
		command: "ss -tulpen || netstat -tulpen",
		label: "List listening ports",
	},
	"server.uptime": {
		command: "uptime",
		label: "Check uptime",
	},
};

const isServerQuickAction = (
	actionId: QuickActionId,
): actionId is ServerQuickActionId => {
	return actionId.startsWith("server.");
};

const buildServerAction = ({
	actionId,
	serverId,
}: {
	actionId: ServerQuickActionId;
	serverId: string;
}): BuiltQuickAction => {
	if (isLocalDockerServer(serverId)) {
		throw new QuickActionUnsupportedError(
			"Server quick actions are only supported for SSH targets.",
		);
	}

	const action = serverActions[actionId];

	return {
		actionId,
		commandLabel: action.label,
		commandPreview: action.command,
		execution: {
			command: action.command,
			kind: "remote",
		},
	};
};

const dockerActionLabels: Record<DockerQuickActionId, string> = {
	"docker.restart": "Restart Docker app",
	"docker.start": "Start Docker app",
	"docker.stop": "Stop Docker app",
};

const pm2ActionLabels: Record<Pm2QuickActionId, string> = {
	"pm2.restart": "Restart PM2 app",
	"pm2.start": "Start PM2 app",
	"pm2.stop": "Stop PM2 app",
};

const isDockerQuickAction = (
	actionId: QuickActionId,
): actionId is DockerQuickActionId => {
	return actionId.startsWith("docker.");
};

const isPm2QuickAction = (
	actionId: QuickActionId,
): actionId is Pm2QuickActionId => {
	return actionId.startsWith("pm2.");
};

const buildDockerAction = ({
	actionId,
	app,
	serverId,
}: {
	actionId: DockerQuickActionId;
	app: AppSnapshot;
	serverId: string;
}): BuiltQuickAction => {
	if (app.kind !== "docker") {
		throw new QuickActionUnsupportedError(
			"Docker restart is only supported for Docker apps.",
		);
	}

	const containerRef = dockerContainerRef(app);
	const dockerSubcommand = actionId.replace("docker.", "");
	const commandPreview = `docker ${dockerSubcommand} ${shellQuote(containerRef)}`;

	return {
		actionId,
		appId: app.id,
		commandLabel: dockerActionLabels[actionId],
		commandPreview,
		execution: isLocalDockerServer(serverId)
			? {
					args: [dockerSubcommand, containerRef],
					file: "docker",
					kind: "local",
				}
			: {
					command: commandPreview,
					kind: "remote",
				},
	};
};

const buildPm2Action = ({
	actionId,
	app,
	serverId,
}: {
	actionId: Pm2QuickActionId;
	app: AppSnapshot;
	serverId: string;
}): BuiltQuickAction => {
	if (isLocalDockerServer(serverId)) {
		throw new QuickActionUnsupportedError(
			"PM2 restart is only supported for SSH targets.",
		);
	}

	if (app.kind !== "pm2") {
		throw new QuickActionUnsupportedError(
			"PM2 restart is only supported for PM2 apps.",
		);
	}

	const processRef = pm2ProcessRef(app);
	const pm2Subcommand = actionId.replace("pm2.", "");
	const commandPreview = `pm2 ${pm2Subcommand} ${shellQuote(processRef)}`;

	return {
		actionId,
		appId: app.id,
		commandLabel: pm2ActionLabels[actionId],
		commandPreview,
		execution: {
			command: commandPreview,
			kind: "remote",
		},
	};
};

export const buildQuickAction = ({
	actionId,
	app,
	serverId,
}: {
	actionId: QuickActionId;
	app?: AppSnapshot;
	serverId: string;
}): BuiltQuickAction => {
	if (isServerQuickAction(actionId)) {
		return buildServerAction({ actionId, serverId });
	}

	if (!app) {
		throw new QuickActionUnsupportedError(
			`Action requires an app target: ${actionId}`,
		);
	}

	if (isDockerQuickAction(actionId)) {
		return buildDockerAction({ actionId, app, serverId });
	}

	if (isPm2QuickAction(actionId)) {
		return buildPm2Action({ actionId, app, serverId });
	}

	throw new QuickActionUnsupportedError(
		`Unsupported quick action: ${actionId}`,
	);
};
