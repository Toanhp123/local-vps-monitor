import type {
	HttpCheck,
	HttpCheckCreateInput,
	HttpCheckListResponse,
	HttpCheckRunAllResponse,
	HttpCheckRunResponse,
	HttpCheckUpdateInput,
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

export const fetchHttpChecks = async (): Promise<HttpCheck[]> => {
	const response = await fetch("/api/http-checks");
	await ensureOk(response);

	const body = (await response.json()) as HttpCheckListResponse;
	return body.checks;
};

export const createHttpCheck = async (
	input: HttpCheckCreateInput,
): Promise<HttpCheck> => {
	const response = await fetch("/api/http-checks", {
		body: JSON.stringify(input),
		headers: { "Content-Type": "application/json" },
		method: "POST",
	});
	await ensureOk(response);

	const body = (await response.json()) as { check: HttpCheck };
	return body.check;
};

export const updateHttpCheck = async (
	checkId: string,
	input: HttpCheckUpdateInput,
): Promise<HttpCheck> => {
	const response = await fetch(`/api/http-checks/${checkId}`, {
		body: JSON.stringify(input),
		headers: { "Content-Type": "application/json" },
		method: "PATCH",
	});
	await ensureOk(response);

	const body = (await response.json()) as { check: HttpCheck };
	return body.check;
};

export const deleteHttpCheck = async (checkId: string) => {
	const response = await fetch(`/api/http-checks/${checkId}`, {
		method: "DELETE",
	});
	await ensureOk(response);
};

export const runHttpCheck = async (checkId: string): Promise<HttpCheck> => {
	const response = await fetch(`/api/http-checks/${checkId}/run`, {
		method: "POST",
	});
	await ensureOk(response);

	const body = (await response.json()) as HttpCheckRunResponse;
	return body.check;
};

export const runAllHttpChecks = async (): Promise<HttpCheckRunAllResponse> => {
	const response = await fetch("/api/http-checks/run-all", {
		method: "POST",
	});
	await ensureOk(response);

	return (await response.json()) as HttpCheckRunAllResponse;
};
