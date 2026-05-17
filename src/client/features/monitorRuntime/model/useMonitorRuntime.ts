import { useCallback, useEffect, useState } from "react";
import type {
	MonitorRuntimeSettings,
	MonitorRuntimeSettingsUpdateInput,
} from "@shared/types";
import {
	fetchMonitorRuntime,
	updateMonitorRuntime,
} from "@/shared/api/monitorRuntimeApi";
import type { ToastState } from "@/shared/ui/Toast";

const errorMessage = (error: unknown) => {
	return error instanceof Error ? error.message : String(error);
};

export function useMonitorRuntime(
	onUpdateComplete?: () => void | Promise<void>,
) {
	const [settings, setSettings] = useState<MonitorRuntimeSettings | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState("");
	const [toast, setToast] = useState<ToastState | null>(null);

	useEffect(() => {
		if (!toast) return undefined;

		const timer = window.setTimeout(() => setToast(null), 3_500);
		return () => window.clearTimeout(timer);
	}, [toast]);

	const loadSettings = useCallback(async () => {
		setIsLoading(true);
		setError("");

		try {
			setSettings(await fetchMonitorRuntime());
		} catch (requestError) {
			setError(errorMessage(requestError));
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadSettings();
	}, [loadSettings]);

	const saveSettings = useCallback(
		async (input: MonitorRuntimeSettingsUpdateInput) => {
			setIsSaving(true);
			setError("");

			try {
				const nextSettings = await updateMonitorRuntime(input);
				setSettings(nextSettings);
				setToast({
					tone: "success",
					message: "Runtime settings updated",
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
		loadSettings,
		saveSettings,
		settings,
		toast,
	};
}
