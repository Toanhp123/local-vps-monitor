import type {
	IncidentStateResponse,
	IncidentStateSnapshot,
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

export const fetchIncidentState =
	async (): Promise<IncidentStateSnapshot> => {
		const response = await fetch("/api/incident-state");
		await ensureOk(response);

		const body = (await response.json()) as IncidentStateResponse;
		return body.state;
	};

export const saveIncidentState = async (
	state: IncidentStateSnapshot,
) => {
	const response = await fetch("/api/incident-state", {
		body: JSON.stringify(state),
		headers: { "Content-Type": "application/json" },
		method: "PUT",
	});
	await ensureOk(response);

	const body = (await response.json()) as IncidentStateResponse;
	return body.state;
};
