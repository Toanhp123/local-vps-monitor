import type {
	SshScanAllResponse,
	SshScanResult,
	SshTarget,
	SshTargetCreateInput,
	SshTargetListResponse,
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

export const fetchSshTargets = async (): Promise<SshTarget[]> => {
	const response = await fetch("/api/ssh-targets");
	await ensureOk(response);

	const body = (await response.json()) as SshTargetListResponse;
	return body.targets;
};

export const createSshTarget = async (
	input: SshTargetCreateInput,
): Promise<SshTarget> => {
	const response = await fetch("/api/ssh-targets", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(input),
	});
	await ensureOk(response);

	const body = (await response.json()) as { target: SshTarget };
	return body.target;
};

export const deleteSshTarget = async (targetId: string) => {
	const response = await fetch(`/api/ssh-targets/${targetId}`, {
		method: "DELETE",
	});
	await ensureOk(response);
};

export const scanSshTarget = async (
	targetId: string,
): Promise<SshScanResult> => {
	const response = await fetch(`/api/ssh-targets/${targetId}/scan`, {
		method: "POST",
	});
	await ensureOk(response);

	const body = (await response.json()) as { result: SshScanResult };
	return body.result;
};

export const scanAllSshTargets = async (): Promise<SshScanAllResponse> => {
	const response = await fetch("/api/ssh-targets/scan-all", {
		method: "POST",
	});
	await ensureOk(response);

	return (await response.json()) as SshScanAllResponse;
};
