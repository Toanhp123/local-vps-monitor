import { useCallback, useEffect, useState } from "react";
import type {
	ServerAlertPolicy,
	ServerAlertPolicyUpdateInput,
} from "@shared/types";
import {
	fetchServerAlertPolicy,
	updateServerAlertPolicy,
} from "@/shared/api/serverAlertPolicyApi";
import type { ToastState } from "@/shared/ui/Toast";

const errorMessage = (error: unknown) => {
	return error instanceof Error ? error.message : String(error);
};

export function useServerAlertPolicy(
	onUpdateComplete?: () => void | Promise<void>,
) {
	const [policy, setPolicy] = useState<ServerAlertPolicy | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState("");
	const [toast, setToast] = useState<ToastState | null>(null);

	useEffect(() => {
		if (!toast) return undefined;

		const timer = window.setTimeout(() => setToast(null), 3_500);
		return () => window.clearTimeout(timer);
	}, [toast]);

	const loadPolicy = useCallback(async () => {
		setIsLoading(true);
		setError("");

		try {
			setPolicy(await fetchServerAlertPolicy());
		} catch (requestError) {
			setError(errorMessage(requestError));
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadPolicy();
	}, [loadPolicy]);

	const savePolicy = useCallback(
		async (input: ServerAlertPolicyUpdateInput) => {
			setIsSaving(true);
			setError("");

			try {
				const nextPolicy = await updateServerAlertPolicy(input);
				setPolicy(nextPolicy);
				setToast({
					tone: "success",
					message: "Alert policy updated",
				});

				if (onUpdateComplete) {
					await onUpdateComplete();
				}

				return true;
			} catch (requestError) {
				const message = errorMessage(requestError);
				setError(message);
				setToast({ tone: "error", message });
				return false;
			} finally {
				setIsSaving(false);
			}
		},
		[onUpdateComplete],
	);

	return {
		error,
		isLoading,
		isSaving,
		loadPolicy,
		policy,
		savePolicy,
		toast,
	};
}
