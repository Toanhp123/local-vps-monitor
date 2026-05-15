import { useCallback, useEffect, useState } from "react";
import { scanLocalDocker } from "../../../shared/api/localDockerApi";
import type { ToastState } from "../../../shared/ui/Toast";

export const localDockerServerId = "local-docker";

export type LocalDockerScanSource = "panel" | "server-list";

const errorMessage = (error: unknown) => {
	return error instanceof Error ? error.message : String(error);
};

interface BackgroundScanOptions {
	showSuccessToast?: boolean;
}

export function useLocalDockerScanner(
	onScanComplete?: () => void | Promise<void>,
) {
	const [activeScanSource, setActiveScanSource] =
		useState<LocalDockerScanSource | null>(null);
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

	const runScan = useCallback(
		async ({
			source,
			showSuccessToast,
		}: {
			source: LocalDockerScanSource | null;
			showSuccessToast: boolean;
		}) => {
			if (source) setActiveScanSource(source);

			try {
				const result = await scanLocalDocker();
				if (showSuccessToast) {
					setToast({
						tone: "success",
						message: `${result.serverName}: ${result.appCount} apps scanned`,
					});
				}
				await refreshOverview();
			} catch (requestError) {
				const message = errorMessage(requestError);
				setToast({
					tone: "error",
					message,
				});
			} finally {
				if (source) setActiveScanSource(null);
			}
		},
		[refreshOverview],
	);

	const scanFrom = useCallback(async (source: LocalDockerScanSource) => {
		await runScan({ source, showSuccessToast: true });
	}, [runScan]);

	const scanInBackground = useCallback(
		async (options: BackgroundScanOptions = {}) => {
			await runScan({
				source: null,
				showSuccessToast: Boolean(options.showSuccessToast),
			});
		},
		[runScan],
	);

	return {
		activeScanSource,
		isScanning: Boolean(activeScanSource),
		scanFrom,
		scanInBackground,
		serverId: localDockerServerId,
		toast,
	};
}
