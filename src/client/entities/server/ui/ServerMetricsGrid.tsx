import type { StoredServer } from "../../../../shared/types";
import { formatBytes, formatDuration } from "../../../shared/lib/format";
import { serverMemory } from "../model/serverMetrics";

const metricLabelClass = "block text-[13px] font-bold text-slate-500";
const metricValueClass = "mt-1.5 block font-bold text-slate-900";

export function ServerMetricsGrid({ server }: { server: StoredServer }) {
	const memory = serverMemory(server);

	return (
		<div className="grid grid-cols-4 gap-px bg-slate-200 max-md:grid-cols-1">
			<div className="min-h-19 bg-slate-50 px-4.5 py-3.75">
				<span className={metricLabelClass}>Load</span>
				<strong className={metricValueClass}>
					{server.host.loadAverage
						.slice(0, 3)
						.map((value) => value.toFixed(2))
						.join(" / ")}
				</strong>
			</div>
			<div className="min-h-19 bg-slate-50 px-4.5 py-3.75">
				<span className={metricLabelClass}>CPU</span>
				<strong className={metricValueClass}>
					{server.host.cpuCount} cores
				</strong>
			</div>
			<div className="min-h-19 bg-slate-50 px-4.5 py-3.75">
				<span className={metricLabelClass}>Memory</span>
				<strong className={metricValueClass}>
					{formatBytes(memory.used)} /{" "}
					{formatBytes(server.host.memoryTotalBytes)} ({memory.percent}%)
				</strong>
			</div>
			<div className="min-h-19 bg-slate-50 px-4.5 py-3.75">
				<span className={metricLabelClass}>Uptime</span>
				<strong className={metricValueClass}>
					{formatDuration(server.host.uptimeSeconds)}
				</strong>
			</div>
		</div>
	);
}
