import { AlertTriangle, CircleCheck, CircleX, Clock } from "lucide-react";
import type { HealthStatus } from "@shared/types";
import { Badge } from "./Badge";

const statusLabels: Record<HealthStatus, string> = {
	healthy: "Healthy",
	warning: "Warning",
	down: "Down",
	unknown: "Unknown",
};

const statusIcons = {
	healthy: CircleCheck,
	warning: AlertTriangle,
	down: CircleX,
	unknown: Clock,
};

const statusTones: Record<HealthStatus, "amber" | "gray" | "green" | "red"> = {
	healthy: "green",
	warning: "amber",
	down: "red",
	unknown: "gray",
};

export function StatusBadge({ status }: { status: HealthStatus }) {
	const Icon = statusIcons[status];

	return (
		<Badge icon={Icon} tone={statusTones[status]}>
			{statusLabels[status]}
		</Badge>
	);
}
