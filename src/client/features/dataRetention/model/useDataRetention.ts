import { useCallback, useEffect, useState } from "react";
import type {
	DatabaseStats,
	DataRetentionSettings,
	DataRetentionSettingsUpdateInput,
} from "@shared/types";
import {
	cleanupDatabase,
	fetchDatabaseStats,
	fetchDataRetentionSettings,
	updateDataRetentionSettings,
	vacuumDatabase,
} from "@/shared/api/dataRetentionApi";
import type { ToastState } from "@/shared/ui/Toast";

export type DataRetentionMaintenanceAction = "cleanup" | "vacuum";

const errorMessage = (error: unknown) => {
	return error instanceof Error ? error.message : String(error);
};

export function useDataRetention() {
	const [settings, setSettings] = useState<DataRetentionSettings | null>(null);
	const [stats, setStats] = useState<DatabaseStats | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isStatsLoading, setIsStatsLoading] = useState(false);
	const [activeMaintenanceAction, setActiveMaintenanceAction] =
		useState<DataRetentionMaintenanceAction | null>(null);
	const [error, setError] = useState("");
	const [toast, setToast] = useState<ToastState | null>(null);

	useEffect(() => {
		if (!toast) return undefined;

		const timer = window.setTimeout(() => setToast(null), 3_500);
		return () => window.clearTimeout(timer);
	}, [toast]);

	const loadStats = useCallback(async (showSuccess = false) => {
		setIsStatsLoading(true);
		setError("");

		try {
			setStats(await fetchDatabaseStats());
			if (showSuccess) {
				setToast({
					tone: "success",
					message: "Database stats refreshed",
				});
			}
		} catch (requestError) {
			const message = errorMessage(requestError);
			setError(message);
			setToast({ tone: "error", message });
		} finally {
			setIsStatsLoading(false);
		}
	}, []);

	const loadSettings = useCallback(async () => {
		setIsLoading(true);
		setError("");

		try {
			const [nextSettings, nextStats] = await Promise.all([
				fetchDataRetentionSettings(),
				fetchDatabaseStats(),
			]);
			setSettings(nextSettings);
			setStats(nextStats);
		} catch (requestError) {
			const message = errorMessage(requestError);
			setError(message);
			setToast({ tone: "error", message });
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadSettings();
	}, [loadSettings]);

	const saveSettings = useCallback(
		async (input: DataRetentionSettingsUpdateInput) => {
			setIsSaving(true);
			setError("");

			try {
				const nextSettings = await updateDataRetentionSettings(input);
				setSettings(nextSettings);
				setToast({
					tone: "success",
					message: "Data retention settings saved",
				});
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
		[],
	);

	const runCleanup = useCallback(
		async (input: DataRetentionSettingsUpdateInput) => {
			setActiveMaintenanceAction("cleanup");
			setError("");

			try {
				const nextSettings = await updateDataRetentionSettings(input);
				setSettings(nextSettings);

				const result = await cleanupDatabase();
				setStats(await fetchDatabaseStats());
				setToast({
					tone: "success",
					message: `Cleanup removed ${result.metricsDeleted} metrics and ${result.incidentsDeleted} incidents`,
				});
				return true;
			} catch (requestError) {
				const message = errorMessage(requestError);
				setError(message);
				setToast({ tone: "error", message });
				return false;
			} finally {
				setActiveMaintenanceAction(null);
			}
		},
		[],
	);

	const vacuum = useCallback(async () => {
		setActiveMaintenanceAction("vacuum");
		setError("");

		try {
			await vacuumDatabase();
			setStats(await fetchDatabaseStats());
			setToast({
				tone: "success",
				message: "Database vacuum completed",
			});
			return true;
		} catch (requestError) {
			const message = errorMessage(requestError);
			setError(message);
			setToast({ tone: "error", message });
			return false;
		} finally {
			setActiveMaintenanceAction(null);
		}
	}, []);

	return {
		activeMaintenanceAction,
		error,
		isLoading,
		isSaving,
		isStatsLoading,
		loadSettings,
		loadStats,
		runCleanup,
		saveSettings,
		settings,
		stats,
		toast,
		vacuum,
	};
}
