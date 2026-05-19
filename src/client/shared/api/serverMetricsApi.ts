import type {
	ServerHistoricalMetricPoint,
	ServerMetricHistoryRange,
	ServerMetricHistoryResponse,
} from "@shared/types";

const parseErrorMessage = async (response: Response) => {
	try {
		const body = (await response.json()) as { message?: string; error?: string };
		return body.message || body.error || `API returned ${response.status}`;
	} catch {
		return `API returned ${response.status}`;
	}
};

const ensureOk = async (response: Response) => {
	if (response.ok) return;
	throw new Error(await parseErrorMessage(response));
};

export const fetchServerMetricHistory = async (
	serverId: string,
	range: ServerMetricHistoryRange,
): Promise<ServerHistoricalMetricPoint[]> => {
	const search = new URLSearchParams({ range });
	const response = await fetch(
		`/api/database/servers/${encodeURIComponent(serverId)}/metrics?${search}`,
	);
	await ensureOk(response);

	const body = (await response.json()) as ServerMetricHistoryResponse;
	return body.metrics;
};
