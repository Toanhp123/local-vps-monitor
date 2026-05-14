import { AlertTriangle, CircleCheck, CircleX, Clock } from "lucide-react";
import type { HealthStatus } from "../../../shared/types";

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

const statusClasses: Record<HealthStatus, string> = {
	healthy: "bg-green-100 text-green-800",
	warning: "bg-amber-100 text-amber-800",
	down: "bg-red-100 text-red-800",
	unknown: "bg-gray-200 text-gray-700",
};

export function StatusBadge({ status }: { status: HealthStatus }) {
	const Icon = statusIcons[status];

	return (
		<span
			className={`inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-extrabold leading-none align-middle ${statusClasses[status]}`}
		>
			<Icon size={14} />
			{statusLabels[status]}
		</span>
	);
}
