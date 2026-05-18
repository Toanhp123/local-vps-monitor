import { AlertTriangle, CircleCheck, CircleX, WifiOff } from "lucide-react";
import type { HealthStatus } from "@shared/types";
import { Badge } from "./Badge";

export function ServerStatusBadge({
	online,
	status,
}: {
	online: boolean;
	status: HealthStatus;
}) {
	if (!online) {
		return (
			<Badge icon={WifiOff} tone="gray">
				Offline
			</Badge>
		);
	}

	if (status === "down") {
		return (
			<Badge icon={CircleX} tone="red">
				Critical
			</Badge>
		);
	}

	if (status === "warning") {
		return (
			<Badge icon={AlertTriangle} tone="amber">
				Warning
			</Badge>
		);
	}

	return (
		<Badge icon={CircleCheck} tone="green">
			Healthy
		</Badge>
	);
}
