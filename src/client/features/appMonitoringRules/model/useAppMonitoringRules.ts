import { useCallback, useEffect, useState } from "react";
import type {
	AppMonitorAppOverrideInput,
	AppMonitorRule,
} from "../../../../shared/types";
import {
	fetchAppMonitorRules,
	upsertAppMonitorOverride,
} from "../../../shared/api/appMonitorRulesApi";
import type { ToastState } from "../../../shared/ui/Toast";

const errorMessage = (error: unknown) => {
	return error instanceof Error ? error.message : String(error);
};

const appKey = (input: Pick<AppMonitorAppOverrideInput, "appId" | "serverId">) =>
	`${input.serverId}:${input.appId}`;

export function useAppMonitoringRules(
	onRulesChanged?: () => void | Promise<void>,
) {
	const [activeAppKey, setActiveAppKey] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [rules, setRules] = useState<AppMonitorRule[]>([]);
	const [toast, setToast] = useState<ToastState | null>(null);

	useEffect(() => {
		if (!toast) return undefined;

		const timer = window.setTimeout(() => setToast(null), 3_500);
		return () => window.clearTimeout(timer);
	}, [toast]);

	const loadRules = useCallback(async () => {
		setError("");

		try {
			setRules(await fetchAppMonitorRules());
		} catch (requestError) {
			setError(errorMessage(requestError));
		}
	}, []);

	useEffect(() => {
		void loadRules();
	}, [loadRules]);

	const refreshOverview = useCallback(async () => {
		if (!onRulesChanged) return;

		try {
			await onRulesChanged();
		} catch {
			// The WebSocket overview update is the primary refresh path.
		}
	}, [onRulesChanged]);

	const upsertAppOverride = useCallback(
		async (input: AppMonitorAppOverrideInput) => {
			const key = appKey(input);
			setActiveAppKey(key);
			setError("");

			try {
				const rule = await upsertAppMonitorOverride(input);
				await loadRules();
				await refreshOverview();
				setToast({
					tone: "success",
					message: rule
						? `${input.appName} policy saved`
						: `${input.appName} policy reset`,
				});
				return true;
			} catch (requestError) {
				const message = errorMessage(requestError);
				setError(message);
				setToast({ tone: "error", message });
				return false;
			} finally {
				setActiveAppKey(null);
			}
		},
		[loadRules, refreshOverview],
	);

	return {
		activeAppKey,
		error,
		isSaving: activeAppKey !== null,
		loadRules,
		rules,
		toast,
		upsertAppOverride,
	};
}
