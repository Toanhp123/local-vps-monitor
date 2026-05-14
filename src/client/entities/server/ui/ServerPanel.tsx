import { LoaderCircle, RefreshCw, Server, WifiOff } from "lucide-react";
import type { StoredServer } from "../../../../shared/types";
import { ApplicationTable } from "../../application/ui/ApplicationTable";
import {
	formatBytes,
	formatDuration,
	relativeTime,
} from "../../../shared/lib/format";
import { StatusBadge } from "../../../shared/ui/StatusBadge";

const metricLabelClass = "block text-[13px] font-bold text-slate-500";
const metricValueClass = "mt-1.5 block font-bold text-slate-900";

export function ServerPanel({
	isScanDisabled,
	isScanning,
	now,
	onScan,
	server,
}: {
	isScanDisabled: boolean;
	isScanning: boolean;
	now: number;
	onScan: () => void;
	server: StoredServer;
}) {
	const memoryUsed =
		server.host.memoryTotalBytes - server.host.memoryFreeBytes;
	const memoryPercent = server.host.memoryTotalBytes
		? Math.round((memoryUsed / server.host.memoryTotalBytes) * 100)
		: 0;

	return (
		<section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
			<div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4.5 max-md:flex-col max-md:items-stretch">
				<div>
					<div className="mb-1.5 flex items-center gap-2.5">
						{server.online ? (
							<Server size={20} className="text-blue-600" />
						) : (
							<WifiOff size={20} className="text-blue-600" />
						)}
						<h2 className="text-xl leading-tight font-bold text-slate-900">
							{server.serverName}
						</h2>
					</div>
					<p className="text-sm text-slate-500">
						{server.host.hostname} - {server.host.platform}/
						{server.host.arch} - collector{" "}
						{server.collectorVersion || "unknown"}
					</p>
				</div>
				<div className="flex flex-col items-end gap-2 text-right max-md:items-start max-md:text-left">
					<div className="flex flex-wrap items-center justify-end gap-2 max-md:justify-start">
						<StatusBadge status={server.status} />
						<button
							type="button"
							className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
							onClick={onScan}
							disabled={isScanDisabled}
							aria-label={`Scan ${server.serverName}`}
						>
							{isScanning ? (
								<LoaderCircle size={15} className="animate-spin" />
							) : (
								<RefreshCw size={15} />
							)}
							Scan
						</button>
					</div>
					<span className="block text-[13px] font-bold text-slate-500">
						Last seen {relativeTime(server.lastSeenAt, now)}
					</span>
				</div>
			</div>

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
						{formatBytes(memoryUsed)} /{" "}
						{formatBytes(server.host.memoryTotalBytes)} (
						{memoryPercent}%)
					</strong>
				</div>
				<div className="min-h-19 bg-slate-50 px-4.5 py-3.75">
					<span className={metricLabelClass}>Uptime</span>
					<strong className={metricValueClass}>
						{formatDuration(server.host.uptimeSeconds)}
					</strong>
				</div>
			</div>

			<ApplicationTable apps={server.apps} />
		</section>
	);
}
