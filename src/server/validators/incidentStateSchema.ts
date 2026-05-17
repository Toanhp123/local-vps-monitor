import { z } from "zod";

const incidentIdSchema = z.string().trim().min(1).max(400);

export const incidentStateSchema = z
	.object({
		acknowledgedIncidentIds: z.array(incidentIdSchema).max(500),
		readIncidentIds: z.array(incidentIdSchema).max(500),
		snoozedIncidents: z
			.array(
				z
					.object({
						incidentId: incidentIdSchema,
						snoozedUntil: z.number().int().nonnegative(),
					})
					.strict(),
			)
			.max(500),
	})
	.strict();
