import type {
	PinnedItemsResponse,
	PinnedItemsSnapshot,
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

export const fetchPinnedItems = async (): Promise<PinnedItemsSnapshot> => {
	const response = await fetch("/api/pinned-items");
	await ensureOk(response);

	const body = (await response.json()) as PinnedItemsResponse;
	return body.pinnedItems;
};

export const savePinnedItems = async (
	pinnedItems: PinnedItemsSnapshot,
) => {
	const response = await fetch("/api/pinned-items", {
		body: JSON.stringify(pinnedItems),
		headers: { "Content-Type": "application/json" },
		method: "PUT",
	});
	await ensureOk(response);

	const body = (await response.json()) as PinnedItemsResponse;
	return body.pinnedItems;
};
