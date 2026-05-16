import type {
	HttpCheck,
	HttpCheckResult,
	IncidentEvent,
	IncidentSeverity,
	StoredServer,
} from "../../../shared/types";

const httpStatusLabel: Record<HttpCheckResult["status"], string> = {
	down: "down",
	healthy: "healthy",
	unknown: "unknown",
	warning: "warning",
};

const severityForStatus = (
	status: HttpCheckResult["status"],
): IncidentSeverity => {
	if (status === "healthy") return "resolved";
	if (status === "down") return "critical";
	if (status === "warning") return "warning";

	return "warning";
};

const incidentId = (
	serverId: string,
	checkId: string,
	checkedAt: string,
	status: HttpCheckResult["status"],
) => `${serverId}:http-check:${checkId}:${checkedAt}:${status}`;

export const createHttpCheckIncident = ({
	check,
	previousResult,
	result,
	server,
}: {
	check: HttpCheck;
	previousResult: HttpCheckResult | undefined;
	result: HttpCheckResult;
	server: StoredServer;
}): IncidentEvent | null => {
	if (!check.serverId) return null;
	if (previousResult?.status === result.status) return null;
	if (result.status === "healthy" && !previousResult) return null;

	const statusLabel = httpStatusLabel[result.status];
	const previousLabel = previousResult
		? ` Previous check was ${httpStatusLabel[previousResult.status]}.`
		: "";
	const statusCodeText =
		result.statusCode === undefined ? "" : ` Status ${result.statusCode}.`;
	const latencyText =
		result.latencyMs === undefined ? "" : ` Latency ${result.latencyMs}ms.`;
	const errorText = result.error ? ` ${result.error}` : "";
	const title =
		result.status === "healthy"
			? `${check.name} recovered`
			: `${check.name} is ${statusLabel}`;

	return {
		id: incidentId(
			check.serverId,
			check.id,
			result.checkedAt,
			result.status,
		),
		appId: check.appId,
		currentHealth:
			result.status === "healthy"
				? "healthy"
				: result.status === "warning"
					? "warning"
					: "down",
		kind: "http-check",
		message: `${check.name} HTTP check is ${statusLabel}.${statusCodeText}${latencyText}${errorText}${previousLabel}`,
		occurredAt: result.checkedAt,
		previousHealth:
			previousResult?.status === "healthy"
				? "healthy"
				: previousResult?.status === "warning"
					? "warning"
					: previousResult
						? "down"
						: undefined,
		serverId: check.serverId,
		serverName: server.serverName,
		severity: severityForStatus(result.status),
		title,
	};
};
