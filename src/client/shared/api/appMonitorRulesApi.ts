import type {
	AppMonitorAppOverrideInput,
	AppMonitorRule,
	AppMonitorRuleCreateInput,
	AppMonitorRuleListResponse,
	AppMonitorRuleResponse,
	AppMonitorRuleUpdateInput,
} from "../../../shared/types";

const parseError = async (response: Response) => {
	try {
		const body = (await response.json()) as { error?: string };
		return body.error || `API returned ${response.status}`;
	} catch {
		return `API returned ${response.status}`;
	}
};

export const fetchAppMonitorRules = async (): Promise<AppMonitorRule[]> => {
	const response = await fetch("/api/app-monitor-rules");
	if (!response.ok) throw new Error(await parseError(response));

	const body = (await response.json()) as AppMonitorRuleListResponse;
	return body.rules;
};

export const createAppMonitorRule = async (
	input: AppMonitorRuleCreateInput,
) => {
	const response = await fetch("/api/app-monitor-rules", {
		body: JSON.stringify(input),
		headers: { "Content-Type": "application/json" },
		method: "POST",
	});
	if (!response.ok) throw new Error(await parseError(response));

	const body = (await response.json()) as AppMonitorRuleResponse;
	return body.rule;
};

export const updateAppMonitorRule = async (
	ruleId: string,
	input: AppMonitorRuleUpdateInput,
) => {
	const response = await fetch(
		`/api/app-monitor-rules/${encodeURIComponent(ruleId)}`,
		{
			body: JSON.stringify(input),
			headers: { "Content-Type": "application/json" },
			method: "PATCH",
		},
	);
	if (!response.ok) throw new Error(await parseError(response));

	const body = (await response.json()) as AppMonitorRuleResponse;
	return body.rule;
};

export const upsertAppMonitorOverride = async (
	input: AppMonitorAppOverrideInput,
) => {
	const response = await fetch("/api/app-monitor-rules/app-override", {
		body: JSON.stringify(input),
		headers: { "Content-Type": "application/json" },
		method: "PUT",
	});
	if (!response.ok) throw new Error(await parseError(response));

	const body = (await response.json()) as AppMonitorRuleResponse;
	return body.rule;
};

export const deleteAppMonitorRule = async (ruleId: string) => {
	const response = await fetch(
		`/api/app-monitor-rules/${encodeURIComponent(ruleId)}`,
		{ method: "DELETE" },
	);
	if (!response.ok) throw new Error(await parseError(response));
};
