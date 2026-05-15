import { useCallback, useEffect, useState } from "react";
import type { AppLogsResponse, AppSnapshot } from "../../../../shared/types";
import { fetchAppLogs } from "../../../shared/api/appLogsApi";

const errorMessage = (error: unknown) => {
	return error instanceof Error ? error.message : String(error);
};

export function useAppLogs(serverId: string) {
	const [app, setApp] = useState<AppSnapshot | null>(null);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [lineCount, setLineCount] = useState(200);
	const [logs, setLogs] = useState<AppLogsResponse | null>(null);

	const loadLogs = useCallback(
		async (nextApp: AppSnapshot, nextLineCount = lineCount) => {
			setApp(nextApp);
			setError("");
			setIsLoading(true);

			try {
				setLogs(
					await fetchAppLogs({
						appId: nextApp.id,
						lines: nextLineCount,
						serverId,
					}),
				);
			} catch (requestError) {
				setLogs(null);
				setError(errorMessage(requestError));
			} finally {
				setIsLoading(false);
			}
		},
		[lineCount, serverId],
	);

	const closeLogs = useCallback(() => {
		setApp(null);
		setError("");
		setLogs(null);
	}, []);

	useEffect(() => {
		closeLogs();
	}, [closeLogs, serverId]);

	const changeLineCount = useCallback(
		(nextLineCount: number) => {
			setLineCount(nextLineCount);

			if (app && !isLoading) {
				void loadLogs(app, nextLineCount);
			}
		},
		[app, isLoading, loadLogs],
	);

	const refreshLogs = useCallback(() => {
		if (!app || isLoading) return;
		void loadLogs(app);
	}, [app, isLoading, loadLogs]);

	return {
		app,
		changeLineCount,
		closeLogs,
		error,
		isLoading,
		isOpen: Boolean(app),
		lineCount,
		loadLogs,
		logs,
		refreshLogs,
	};
}
