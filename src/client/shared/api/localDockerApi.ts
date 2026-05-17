import type { ScanResult } from "@shared/types";

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

export const scanLocalDocker = async (): Promise<ScanResult> => {
	const response = await fetch("/api/local-docker/scan", {
		method: "POST",
	});
	await ensureOk(response);

	const body = (await response.json()) as { result: ScanResult };
	return body.result;
};
