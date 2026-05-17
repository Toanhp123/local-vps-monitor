import { useCallback, useEffect, useState } from "react";
import type {
	AppPolicyOverrideInput,
	AppPolicy,
} from "@shared/types";
import {
	fetchAppPolicies,
	upsertAppPolicyOverride,
} from "@/shared/api/appPoliciesApi";
import type { ToastState } from "@/shared/ui/Toast";

const errorMessage = (error: unknown) => {
	return error instanceof Error ? error.message : String(error);
};

const appKey = (input: Pick<AppPolicyOverrideInput, "appId" | "serverId">) =>
	`${input.serverId}:${input.appId}`;

export function useAppPolicies(
	onPoliciesChanged?: () => void | Promise<void>,
) {
	const [activeAppKey, setActiveAppKey] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [policies, setPolicies] = useState<AppPolicy[]>([]);
	const [toast, setToast] = useState<ToastState | null>(null);

	useEffect(() => {
		if (!toast) return undefined;

		const timer = window.setTimeout(() => setToast(null), 3_500);
		return () => window.clearTimeout(timer);
	}, [toast]);

	const loadPolicies = useCallback(async () => {
		setError("");

		try {
			setPolicies(await fetchAppPolicies());
		} catch (requestError) {
			setError(errorMessage(requestError));
		}
	}, []);

	useEffect(() => {
		void loadPolicies();
	}, [loadPolicies]);

	const refreshOverview = useCallback(async () => {
		if (!onPoliciesChanged) return;

		try {
			await onPoliciesChanged();
		} catch {
			// The WebSocket overview update is the primary refresh path.
		}
	}, [onPoliciesChanged]);

	const upsertAppOverride = useCallback(
		async (input: AppPolicyOverrideInput) => {
			const key = appKey(input);
			setActiveAppKey(key);
			setError("");

			try {
				const policy = await upsertAppPolicyOverride(input);
				await loadPolicies();
				await refreshOverview();
				setToast({
					tone: "success",
					message: policy
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
		[loadPolicies, refreshOverview],
	);

	return {
		activeAppKey,
		error,
		isSaving: activeAppKey !== null,
		loadPolicies,
		policies,
		toast,
		upsertAppOverride,
	};
}
