import { useCallback, useEffect, useState } from "react";
import { scanLocalDocker } from "../../../shared/api/localDockerApi";
import type { ToastState } from "../../../shared/ui/Toast";

export const localDockerServerId = "local-docker";

const errorMessage = (error: unknown) => {
	return error instanceof Error ? error.message : String(error);
};

export function useLocalDockerScanner(
	onScanComplete?: () => void | Promise<void>,
) {
	const [isScanning, setIsScanning] = useState(false);
	const [error, setError] = useState("");
	const [toast, setToast] = useState<ToastState | null>(null);

	useEffect(() => {
		if (!toast) return undefined;

		const timer = window.setTimeout(() => {
			setToast(null);
		}, 3_500);

		return () => window.clearTimeout(timer);
	}, [toast]);

	const refreshOverview = useCallback(async () => {
		if (!onScanComplete) return;

		try {
			await onScanComplete();
		} catch {
			// WebSocket should update the dashboard. Manual refresh is only a backup.
		}
	}, [onScanComplete]);

	const scan = useCallback(async () => {
		setIsScanning(true);
		setError("");

		try {
			const result = await scanLocalDocker();
			setToast({
				tone: "success",
				message: `${result.serverName}: ${result.appCount} apps scanned`,
			});
			await refreshOverview();
		} catch (requestError) {
			const message = errorMessage(requestError);
			setError(message);
			setToast({
				tone: "error",
				message,
			});
		} finally {
			setIsScanning(false);
		}
	}, [refreshOverview]);

	const scanInBackground = useCallback(async () => {
		setError("");

		try {
			await scanLocalDocker();
			await refreshOverview();
		} catch (requestError) {
			const message = errorMessage(requestError);
			setError(message);
			setToast({
				tone: "error",
				message,
			});
		}
	}, [refreshOverview]);

	return {
		error,
		isScanning,
		scan,
		scanInBackground,
		serverId: localDockerServerId,
		toast,
	};
}
