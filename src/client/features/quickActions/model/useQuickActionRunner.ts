import { useCallback, useState } from "react";
import type { QuickActionRunResponse } from "@shared/types";
import { runQuickAction } from "@/shared/api/quickActionsApi";
import type { QuickActionDefinition } from "./quickActions";

const errorMessage = (error: unknown) => {
	return error instanceof Error ? error.message : String(error);
};

export const useQuickActionRunner = () => {
	const [error, setError] = useState("");
	const [isRunning, setIsRunning] = useState(false);
	const [pendingAction, setPendingAction] =
		useState<QuickActionDefinition | null>(null);
	const [result, setResult] = useState<QuickActionRunResponse | null>(null);

	const executeAction = useCallback(async (action: QuickActionDefinition) => {
		setError("");
		setIsRunning(true);
		setPendingAction(action);
		setResult(null);

		try {
			setResult(
				await runQuickAction({
					actionId: action.actionId,
					appId: action.appId,
					serverId: action.serverId,
				}),
			);
		} catch (requestError) {
			setError(errorMessage(requestError));
		} finally {
			setIsRunning(false);
		}
	}, []);

	const requestAction = useCallback(
		(action: QuickActionDefinition) => {
			setError("");
			setResult(null);
			setPendingAction(action);

			if (!action.requiresConfirmation) {
				void executeAction(action);
			}
		},
		[executeAction],
	);

	const confirmAction = useCallback(() => {
		if (!pendingAction || isRunning) return;
		void executeAction(pendingAction);
	}, [executeAction, isRunning, pendingAction]);

	const close = useCallback(() => {
		if (isRunning) return;

		setError("");
		setPendingAction(null);
		setResult(null);
	}, [isRunning]);

	return {
		close,
		confirmAction,
		error,
		isOpen: Boolean(pendingAction),
		isRunning,
		pendingAction,
		requestAction,
		result,
	};
};
