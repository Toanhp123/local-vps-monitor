import type { AppSnapshot, QuickActionId } from "../../../shared/types";
import { QuickActionUnsupportedError } from "./quickActionErrors";
import {
	dockerContainerRef,
	isLocalDockerServer,
	pm2ProcessRef,
} from "./quickActionTargets";

type ServerQuickActionId = Extract<QuickActionId, `server.${string}`>;

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

const shellQuote = (value: string) => {
	return `'${value.replace(/'/g, "'\\''")}'`;
};

export const quickActionIds = [
	"docker.restart",
	"pm2.restart",
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
	return actionId === "docker.restart" || actionId === "pm2.restart";
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

const buildDockerRestartAction = ({
	app,
	serverId,
}: {
	app: AppSnapshot;
	serverId: string;
}): BuiltQuickAction => {
	if (app.kind !== "docker") {
		throw new QuickActionUnsupportedError(
			"Docker restart is only supported for Docker apps.",
		);
	}

	const containerRef = dockerContainerRef(app);
	const commandPreview = `docker restart ${shellQuote(containerRef)}`;

	return {
		actionId: "docker.restart",
		appId: app.id,
		commandLabel: "Restart Docker app",
		commandPreview,
		execution: isLocalDockerServer(serverId)
			? {
					args: ["restart", containerRef],
					file: "docker",
					kind: "local",
				}
			: {
					command: commandPreview,
					kind: "remote",
				},
	};
};

const buildPm2RestartAction = ({
	app,
	serverId,
}: {
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
	const commandPreview = `pm2 restart ${shellQuote(processRef)}`;

	return {
		actionId: "pm2.restart",
		appId: app.id,
		commandLabel: "Restart PM2 app",
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

	if (actionId === "docker.restart") {
		return buildDockerRestartAction({ app, serverId });
	}

	if (actionId === "pm2.restart") {
		return buildPm2RestartAction({ app, serverId });
	}

	throw new QuickActionUnsupportedError(
		`Unsupported quick action: ${actionId}`,
	);
};
