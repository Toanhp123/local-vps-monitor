import type { OverviewResponse } from "../../../shared/types";

export const fetchOverview = async (): Promise<OverviewResponse> => {
	const response = await fetch("/api/overview");
	if (!response.ok) throw new Error(`API returned ${response.status}`);

	return (await response.json()) as OverviewResponse;
};
