import {
	AlertTriangle,
	CircleCheck,
	CircleX,
	HardDrive,
	Server,
	WifiOff,
} from "lucide-react";
import type { OverviewResponse } from "../../../../shared/types";
import { StatCard } from "../../../shared/ui/StatCard";

export function SummaryStats({
	overview,
}: {
	overview: OverviewResponse | null;
}) {
	const summary = overview?.summary;
	const totalServers = summary?.totalServers ?? 0;
	const onlineServers = summary?.onlineServers ?? 0;
	const offlineServers = Math.max(0, totalServers - onlineServers);

	return (
		<section className="mb-4.5 grid grid-cols-6 gap-3 max-xl:grid-cols-3 max-md:grid-cols-1">
			<StatCard
				icon={Server}
				label="Online VPS"
				value={`${onlineServers}/${totalServers}`}
				tone="ok"
			/>
			<StatCard
				icon={WifiOff}
				label="Offline VPS"
				value={offlineServers}
				tone={offlineServers > 0 ? "bad" : undefined}
			/>
			<StatCard
				icon={HardDrive}
				label="Total apps"
				value={summary?.totalApps ?? 0}
			/>
			<StatCard
				icon={CircleCheck}
				label="Healthy"
				value={summary?.healthyApps ?? 0}
				tone="ok"
			/>
			<StatCard
				icon={AlertTriangle}
				label="Warnings"
				value={summary?.warningApps ?? 0}
				tone="warn"
			/>
			<StatCard
				icon={CircleX}
				label="Down"
				value={summary?.downApps ?? 0}
				tone="bad"
			/>
		</section>
	);
}
