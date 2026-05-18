import { AlertCircle, BarChart3, GitBranch } from "lucide-react";
import type { DatabaseStats } from "@shared/types";
import { Badge } from "@/shared/ui/Badge";
import { StatCard } from "@/shared/ui/StatCard";

export function DataRetentionBadges({
	stats,
}: {
	stats: DatabaseStats | null;
}) {
	return (
		<>
			<Badge icon={BarChart3} tone="blue">
				{stats?.metricsCount.toLocaleString() ?? "--"} metrics
			</Badge>
			<Badge icon={AlertCircle} tone="amber">
				{stats?.incidentsCount.toLocaleString() ?? "--"} incidents
			</Badge>
			<Badge icon={GitBranch} tone="violet">
				Schema {stats?.schemaVersion ?? "--"}
			</Badge>
		</>
	);
}

export function DataRetentionStatsGrid({
	stats,
}: {
	stats: DatabaseStats | null;
}) {
	return (
		<div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
			<StatCard
				label="Metrics stored"
				value={stats?.metricsCount.toLocaleString() ?? "--"}
				icon={BarChart3}
			/>
			<StatCard
				label="Incidents stored"
				value={stats?.incidentsCount.toLocaleString() ?? "--"}
				icon={AlertCircle}
				tone="warn"
			/>
			<StatCard
				label="Schema version"
				value={stats?.schemaVersion ?? "--"}
				icon={GitBranch}
				tone="default"
			/>
		</div>
	);
}
