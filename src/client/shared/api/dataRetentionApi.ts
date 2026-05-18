import type {
	DatabaseCleanupResponse,
	DatabaseStats,
	DatabaseStatsResponse,
	DataRetentionSettings,
	DataRetentionSettingsResponse,
	DataRetentionSettingsUpdateInput,
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

export const fetchDatabaseStats = async (): Promise<DatabaseStats> => {
	const response = await fetch("/api/database/stats");
	await ensureOk(response);

	const body = (await response.json()) as DatabaseStatsResponse;
	return body.stats;
};

export const fetchDataRetentionSettings =
	async (): Promise<DataRetentionSettings> => {
		const response = await fetch("/api/database/settings");
		await ensureOk(response);

		const body = (await response.json()) as DataRetentionSettingsResponse;
		return body.settings;
	};

export const updateDataRetentionSettings = async (
	input: DataRetentionSettingsUpdateInput,
): Promise<DataRetentionSettings> => {
	const response = await fetch("/api/database/settings", {
		body: JSON.stringify(input),
		headers: { "Content-Type": "application/json" },
		method: "PUT",
	});
	await ensureOk(response);

	const body = (await response.json()) as DataRetentionSettingsResponse;
	return body.settings;
};

export const cleanupDatabase = async () => {
	const response = await fetch("/api/database/cleanup", {
		method: "POST",
	});
	await ensureOk(response);

	const body = (await response.json()) as DatabaseCleanupResponse;
	return body.result;
};

export const vacuumDatabase = async () => {
	const response = await fetch("/api/database/vacuum", {
		method: "POST",
	});
	await ensureOk(response);
};
