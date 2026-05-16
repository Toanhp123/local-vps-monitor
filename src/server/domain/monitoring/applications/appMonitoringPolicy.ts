import type {
	AppImportance,
	AppMonitorRule,
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

const matchText = (rule: AppMonitorRule, app: AppSnapshot) => {
	const match = normalizeText(rule.match);
	if (!match) return false;

	const values = appSearchValues(app);
	const mode = rule.matchMode ?? "contains";

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

const ruleMatchesApp = (
	rule: AppMonitorRule,
	serverId: string,
	app: AppSnapshot,
) => {
	if (!rule.enabled) return false;
	if (rule.serverId && rule.serverId !== serverId) return false;
	if (rule.appKind && rule.appKind !== app.kind) return false;

	if (rule.appId) return rule.appId === app.id;

	return matchText(rule, app);
};

const rulePriority = (rule: AppMonitorRule) => {
	let priority = 0;
	if (rule.appId) priority += 100;
	if (rule.serverId) priority += 20;
	if (rule.appKind) priority += 10;
	if (rule.matchMode === "exact") priority += 3;
	if (rule.matchMode === "regex") priority += 2;
	if (rule.matchMode === "contains") priority += 1;

	return priority;
};

const newestFirst = (left: AppMonitorRule, right: AppMonitorRule) => {
	return (
		new Date(right.updatedAt).getTime() -
		new Date(left.updatedAt).getTime()
	);
};

const bestRuleForApp = (
	rules: AppMonitorRule[],
	serverId: string,
	app: AppSnapshot,
) => {
	return rules
		.filter((rule) => ruleMatchesApp(rule, serverId, app))
		.sort((left, right) => {
			const priorityDiff = rulePriority(right) - rulePriority(left);
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

export const applyAppMonitoringPolicy = (
	apps: AppSnapshot[],
	rules: AppMonitorRule[] = [],
	serverId: string,
) => {
	return apps.map((app) => {
		const rule = bestRuleForApp(rules, serverId, app);
		const displayName = normalizeText(rule?.displayName);

		return {
			...app,
			monitoring: {
				importance: rule?.importance ?? defaultAppImportance,
				...(displayName ? { displayName } : {}),
				...(rule ? { ruleId: rule.id } : {}),
			},
		};
	});
};

export const applyServerMonitoringPolicy = (
	server: StoredServer,
	rules: AppMonitorRule[] = [],
): StoredServer => {
	return {
		...server,
		apps: applyAppMonitoringPolicy(server.apps, rules, server.serverId),
	};
};
