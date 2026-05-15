import type {
	QuickActionRunInput,
	QuickActionRunResponse,
} from "../../../shared/types";

const parseErrorMessage = async (response: Response) => {
	try {
		const body = (await response.json()) as {
			message?: string;
			error?: string;
		};
		return body.message || body.error || `API returned ${response.status}`;
	} catch {
		return `API returned ${response.status}`;
	}
};

export const runQuickAction = async (
	input: QuickActionRunInput,
): Promise<QuickActionRunResponse> => {
	const response = await fetch("/api/quick-actions/run", {
		body: JSON.stringify(input),
		headers: {
			"Content-Type": "application/json",
		},
		method: "POST",
	});

	if (!response.ok) throw new Error(await parseErrorMessage(response));

	const body = (await response.json()) as {
		result: QuickActionRunResponse;
	};
	return body.result;
};
