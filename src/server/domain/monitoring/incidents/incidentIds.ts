export const createIncidentId = (
	serverId: string,
	kind: string,
	subjectId: string,
	observedAt: Date,
	suffix = "",
) => {
	return [serverId, kind, subjectId, observedAt.toISOString(), suffix]
		.filter(Boolean)
		.join(":");
};
