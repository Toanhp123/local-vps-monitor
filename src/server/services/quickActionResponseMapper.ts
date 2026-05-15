import type { QuickActionRunResponse } from "../../shared/types";
import type { BuiltQuickAction } from "../domain/quickActions/quickActionCatalog";
import { stripAnsi } from "../lib/stripAnsi";

const outputLimit = 24_000;

interface QuickActionCommandResult {
	code?: number;
	ok: boolean;
	stderr: string;
	stdout: string;
}

const limitOutput = (value: string) => {
	if (value.length <= outputLimit) return value;

	return `${value.slice(0, outputLimit)}\n[output truncated]`;
};

export const createQuickActionResponse = ({
	action,
	result,
	serverId,
}: {
	action: BuiltQuickAction;
	result: QuickActionCommandResult;
	serverId: string;
}): QuickActionRunResponse => {
	return {
		actionId: action.actionId,
		appId: action.appId,
		commandLabel: action.commandLabel,
		commandPreview: action.commandPreview,
		exitCode: result.code,
		ok: result.ok,
		ranAt: new Date().toISOString(),
		serverId,
		stderr: limitOutput(stripAnsi(result.stderr)),
		stdout: limitOutput(stripAnsi(result.stdout)),
	};
};
