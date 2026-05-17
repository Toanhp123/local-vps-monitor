import type {
	AppPolicyOverrideInput,
	AppPolicy,
	AppPolicyCreateInput,
	AppPolicyListResponse,
	AppPolicyResponse,
	AppPolicyUpdateInput,
} from "../../../shared/types";

const parseError = async (response: Response) => {
	try {
		const body = (await response.json()) as { error?: string };
		return body.error || `API returned ${response.status}`;
	} catch {
		return `API returned ${response.status}`;
	}
};

export const fetchAppPolicies = async (): Promise<AppPolicy[]> => {
	const response = await fetch("/api/app-policies");
	if (!response.ok) throw new Error(await parseError(response));

	const body = (await response.json()) as AppPolicyListResponse;
	return body.policies ?? body.rules ?? [];
};

export const createAppPolicy = async (
	input: AppPolicyCreateInput,
) => {
	const response = await fetch("/api/app-policies", {
		body: JSON.stringify(input),
		headers: { "Content-Type": "application/json" },
		method: "POST",
	});
	if (!response.ok) throw new Error(await parseError(response));

	const body = (await response.json()) as AppPolicyResponse;
	return body.policy ?? body.rule ?? null;
};

export const updateAppPolicy = async (
	policyId: string,
	input: AppPolicyUpdateInput,
) => {
	const response = await fetch(
		`/api/app-policies/${encodeURIComponent(policyId)}`,
		{
			body: JSON.stringify(input),
			headers: { "Content-Type": "application/json" },
			method: "PATCH",
		},
	);
	if (!response.ok) throw new Error(await parseError(response));

	const body = (await response.json()) as AppPolicyResponse;
	return body.policy ?? body.rule ?? null;
};

export const upsertAppPolicyOverride = async (
	input: AppPolicyOverrideInput,
) => {
	const response = await fetch("/api/app-policies/app-override", {
		body: JSON.stringify(input),
		headers: { "Content-Type": "application/json" },
		method: "PUT",
	});
	if (!response.ok) throw new Error(await parseError(response));

	const body = (await response.json()) as AppPolicyResponse;
	return body.policy ?? body.rule ?? null;
};

export const deleteAppPolicy = async (policyId: string) => {
	const response = await fetch(
		`/api/app-policies/${encodeURIComponent(policyId)}`,
		{ method: "DELETE" },
	);
	if (!response.ok) throw new Error(await parseError(response));
};
