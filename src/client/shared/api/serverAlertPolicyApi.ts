import type {
	ServerAlertPolicy,
	ServerAlertPolicyResponse,
	ServerAlertPolicyUpdateInput,
} from "../../../shared/types";

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

export const fetchServerAlertPolicy = async (): Promise<ServerAlertPolicy> => {
	const response = await fetch("/api/server-alert-policy");
	await ensureOk(response);

	const body = (await response.json()) as ServerAlertPolicyResponse;
	return body.policy;
};

export const updateServerAlertPolicy = async (
	input: ServerAlertPolicyUpdateInput,
): Promise<ServerAlertPolicy> => {
	const response = await fetch("/api/server-alert-policy", {
		body: JSON.stringify(input),
		headers: { "Content-Type": "application/json" },
		method: "PUT",
	});
	await ensureOk(response);

	const body = (await response.json()) as ServerAlertPolicyResponse;
	return body.policy;
};
