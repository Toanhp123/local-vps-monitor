import {
	AlertTriangle,
	CircleCheck,
	CircleX,
	Cpu,
	HardDrive,
	Server,
} from "lucide-react";
import type { OverviewResponse } from "../../../../shared/types";
import { relativeTime } from "../../../shared/lib/format";
import { StatCard } from "../../../shared/ui/StatCard";

export function SummaryStats({
	now,
	overview,
	lastDataUpdate,
}: {
	now: number;
	overview: OverviewResponse | null;
	lastDataUpdate: string;
}) {
	return (
		<section className="mb-4.5 grid grid-cols-6 gap-3 max-xl:grid-cols-3 max-md:grid-cols-1">
			<StatCard
				icon={Server}
				label="Servers"
				value={`${overview?.summary.onlineServers ?? 0}/${overview?.summary.totalServers ?? 0}`}
			/>
			<StatCard
				icon={CircleCheck}
				label="Healthy apps"
				value={overview?.summary.healthyApps ?? 0}
				tone="ok"
			/>
			<StatCard
				icon={AlertTriangle}
				label="Warnings"
				value={overview?.summary.warningApps ?? 0}
				tone="warn"
			/>
			<StatCard
				icon={CircleX}
				label="Down apps"
				value={overview?.summary.downApps ?? 0}
				tone="bad"
			/>
			<StatCard
				icon={HardDrive}
				label="Total apps"
				value={overview?.summary.totalApps ?? 0}
			/>
			<StatCard
				icon={Cpu}
				label="Updated"
				value={lastDataUpdate ? relativeTime(lastDataUpdate, now) : "-"}
			/>
		</section>
	);
}
