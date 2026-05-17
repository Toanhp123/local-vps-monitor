import type {
	AppImportance,
	AppPolicy,
	AppSnapshot,
	StoredServer,
} from "../../../../shared/types";

export const defaultAppImportance: AppImportance = "normal";

const normalizeText = (value: string | undefined) => {
	const trimmed = value?.trim();
	return trimmed || undefined;
};

const lower = (value: string) => value.toLowerCase();

const appSearchValues = (app: AppSnapshot) => {
	return [
		app.id,
		app.name,
		app.image,
		app.group?.name,
		app.group?.id,
	].flatMap((value) => (value ? [value] : []));
};

const matchText = (policy: AppPolicy, app: AppSnapshot) => {
	const match = normalizeText(policy.match);
	if (!match) return false;

	const values = appSearchValues(app);
	const mode = policy.matchMode ?? "contains";

	if (mode === "exact") {
		const normalizedMatch = lower(match);
		return values.some((value) => lower(value) === normalizedMatch);
	}

	if (mode === "regex") {
		try {
			const pattern = new RegExp(match, "i");
			return values.some((value) => pattern.test(value));
		} catch {
			return false;
		}
	}

	const normalizedMatch = lower(match);
	return values.some((value) => lower(value).includes(normalizedMatch));
};

const policyMatchesApp = (
	policy: AppPolicy,
	serverId: string,
	app: AppSnapshot,
) => {
	if (!policy.enabled) return false;
	if (policy.serverId && policy.serverId !== serverId) return false;
	if (policy.appKind && policy.appKind !== app.kind) return false;

	if (policy.appId) return policy.appId === app.id;

	return matchText(policy, app);
};

const policyPriority = (policy: AppPolicy) => {
	let priority = 0;
	if (policy.appId) priority += 100;
	if (policy.serverId) priority += 20;
	if (policy.appKind) priority += 10;
	if (policy.matchMode === "exact") priority += 3;
	if (policy.matchMode === "regex") priority += 2;
	if (policy.matchMode === "contains") priority += 1;

	return priority;
};

const newestFirst = (left: AppPolicy, right: AppPolicy) => {
	return (
		new Date(right.updatedAt).getTime() -
		new Date(left.updatedAt).getTime()
	);
};

const bestPolicyForApp = (
	policies: AppPolicy[],
	serverId: string,
	app: AppSnapshot,
) => {
	return policies
		.filter((policy) => policyMatchesApp(policy, serverId, app))
		.sort((left, right) => {
			const priorityDiff = policyPriority(right) - policyPriority(left);
			return priorityDiff || newestFirst(left, right);
		})[0];
};

export const appImportance = (app: AppSnapshot) => {
	return app.monitoring?.importance ?? defaultAppImportance;
};

export const isIgnoredApp = (app: AppSnapshot) => {
	return appImportance(app) === "ignored";
};

export const isMonitoredApp = (app: AppSnapshot) => !isIgnoredApp(app);

export const appDisplayName = (app: AppSnapshot) => {
	return normalizeText(app.monitoring?.displayName) ?? app.name;
};

export const applyEffectiveAppPolicy = (
	apps: AppSnapshot[],
	policies: AppPolicy[] = [],
	serverId: string,
) => {
	return apps.map((app) => {
		const policy = bestPolicyForApp(policies, serverId, app);
		const displayName = normalizeText(policy?.displayName);

		return {
			...app,
			monitoring: {
				importance: policy?.importance ?? defaultAppImportance,
				...(displayName ? { displayName } : {}),
				...(policy ? { policyId: policy.id, ruleId: policy.id } : {}),
			},
		};
	});
};

export const applyServerAppPolicy = (
	server: StoredServer,
	policies: AppPolicy[] = [],
): StoredServer => {
	return {
		...server,
		apps: applyEffectiveAppPolicy(server.apps, policies, server.serverId),
	};
};
