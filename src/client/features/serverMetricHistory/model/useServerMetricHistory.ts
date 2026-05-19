import { useCallback, useEffect, useState } from "react";
import type {
	ServerHistoricalMetricPoint,
	ServerMetricHistoryRange,
} from "@shared/types";
import { fetchServerMetricHistory } from "@/shared/api/serverMetricsApi";

const errorMessage = (error: unknown) => {
	return error instanceof Error ? error.message : String(error);
};

export function useServerMetricHistory(serverId: string, refreshKey?: string) {
	const [range, setRange] = useState<ServerMetricHistoryRange>("24h");
	const [metrics, setMetrics] = useState<ServerHistoricalMetricPoint[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [refreshToken, setRefreshToken] = useState(0);

	const refresh = useCallback(() => {
		setRefreshToken((current) => current + 1);
	}, []);

	useEffect(() => {
		if (!serverId) {
			setMetrics([]);
			setIsLoading(false);
			setError("");
			return undefined;
		}

		let isActive = true;
		setIsLoading(true);
		setError("");

		void fetchServerMetricHistory(serverId, range)
			.then((nextMetrics) => {
				if (isActive) setMetrics(nextMetrics);
			})
			.catch((requestError) => {
				if (isActive) setError(errorMessage(requestError));
			})
			.finally(() => {
				if (isActive) setIsLoading(false);
			});

		return () => {
			isActive = false;
		};
	}, [range, refreshKey, refreshToken, serverId]);

	return {
		error,
		isLoading,
		metrics,
		range,
		refresh,
		setRange,
	};
}
