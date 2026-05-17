import type { AppLogsResponse } from "@shared/types";

const parseErrorMessage = async (response: Response) => {
	try {
		const body = (await response.json()) as { message?: string; error?: string };
		return body.message || body.error || `API returned ${response.status}`;
	} catch {
		return `API returned ${response.status}`;
	}
};

export const fetchAppLogs = async ({
	appId,
	lines = 200,
	serverId,
}: {
	appId: string;
	lines?: number;
	serverId: string;
}): Promise<AppLogsResponse> => {
	const search = new URLSearchParams({ lines: String(lines) });
	const response = await fetch(
		`/api/servers/${encodeURIComponent(serverId)}/apps/${encodeURIComponent(appId)}/logs?${search.toString()}`,
	);

	if (!response.ok) throw new Error(await parseErrorMessage(response));

	const body = (await response.json()) as { logs: AppLogsResponse };
	return body.logs;
};
