import type { StoredServer } from "../../../../shared/types";
import { formatBytes, formatDuration } from "../../../shared/lib/format";
import { serverDisk, serverMemory } from "../model/serverMetrics";

const metricLabelClass = "block text-[13px] font-bold text-slate-500";
const metricValueClass = "mt-1.5 block font-bold text-slate-900";

const isLoadAverageAvailable = (platform: string) => {
	return !platform.toLowerCase().startsWith("win");
};

export function ServerMetricsGrid({ server }: { server: StoredServer }) {
	const memory = serverMemory(server);
	const disk = serverDisk(server);
	const hasLoadAverage = isLoadAverageAvailable(server.host.platform);
	const loadAverage = server.host.loadAverage
		.slice(0, 3)
		.map((value) => value.toFixed(2))
		.join(" / ");

	return (
		<div className="grid grid-cols-5 gap-px bg-slate-200 max-xl:grid-cols-3 max-md:grid-cols-1">
			<div className="min-h-19 bg-slate-50 px-4.5 py-3.75">
				<span className={metricLabelClass}>Load avg</span>
				<strong className={metricValueClass}>
					{hasLoadAverage ? loadAverage : "Not available"}
				</strong>
				<span className="mt-1 block text-xs font-semibold text-slate-400">
					{hasLoadAverage ? "1m / 5m / 15m" : server.host.platform}
				</span>
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
				<span className={metricLabelClass}>Disk</span>
				<strong className={metricValueClass}>
					{disk
						? `${formatBytes(disk.used)} / ${formatBytes(
								disk.total,
							)} (${disk.percent}%)`
						: "Not available"}
				</strong>
				<span className="mt-1 block text-xs font-semibold text-slate-400">
					{disk
						? server.host.disk?.mount || "Root filesystem"
						: "Disk metrics not collected"}
				</span>
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
