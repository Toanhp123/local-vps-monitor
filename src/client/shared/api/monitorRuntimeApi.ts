import type {
	MonitorRuntimeSettings,
	MonitorRuntimeSettingsResponse,
	MonitorRuntimeSettingsUpdateInput,
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

export const fetchMonitorRuntime = async (): Promise<MonitorRuntimeSettings> => {
	const response = await fetch("/api/monitor-runtime");
	await ensureOk(response);

	const body = (await response.json()) as MonitorRuntimeSettingsResponse;
	return body.settings;
};

export const updateMonitorRuntime = async (
	input: MonitorRuntimeSettingsUpdateInput,
): Promise<MonitorRuntimeSettings> => {
	const response = await fetch("/api/monitor-runtime", {
		body: JSON.stringify(input),
		headers: { "Content-Type": "application/json" },
		method: "PUT",
	});
	await ensureOk(response);

	const body = (await response.json()) as MonitorRuntimeSettingsResponse;
	return body.settings;
};
