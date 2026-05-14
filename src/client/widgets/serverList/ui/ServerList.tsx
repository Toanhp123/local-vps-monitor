import { Fragment, useState } from "react";
import {
	ChevronDown,
	ChevronRight,
	LoaderCircle,
	RefreshCw,
	Server,
	WifiOff,
} from "lucide-react";
import type { StoredServer } from "../../../../shared/types";
import { ApplicationTable } from "../../../entities/application/ui/ApplicationTable";
import {
	formatBytes,
	formatDuration,
	relativeTime,
} from "../../../shared/lib/format";
import { StatusBadge } from "../../../shared/ui/StatusBadge";

const headerCellClass =
	"border-b border-slate-200 bg-white px-3.5 py-3 text-left text-xs font-bold uppercase text-slate-500 whitespace-nowrap";
const bodyCellClass =
	"border-b border-slate-200 px-3.5 py-3 text-left align-middle whitespace-nowrap";
const metricLabelClass = "block text-[13px] font-bold text-slate-500";
const metricValueClass = "mt-1.5 block font-bold text-slate-900";

const serverMemory = (server: StoredServer) => {
	const used = Math.max(
		0,
		server.host.memoryTotalBytes - server.host.memoryFreeBytes,
	);
	const percent = server.host.memoryTotalBytes
		? Math.round((used / server.host.memoryTotalBytes) * 100)
		: 0;

	return { used, percent };
};

export function ServerList({
	activeScanId,
	now,
	onScanServer,
	query,
	servers,
}: {
	activeScanId: string | null;
	now: number;
	onScanServer: (serverId: string) => void;
	query: string;
	servers: StoredServer[];
}) {
	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
	const emptyTitle = query.trim() ? "No matching servers" : "No servers yet";

	const toggleServer = (serverId: string) => {
		setExpandedIds((current) => {
			const next = new Set(current);

			if (next.has(serverId)) {
				next.delete(serverId);
			} else {
				next.add(serverId);
			}

			return next;
		});
	};

	return (
		<section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
			<div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4.5 py-3.5 max-md:flex-col max-md:items-stretch">
				<div>
					<h2 className="text-lg leading-tight font-extrabold text-slate-900">
						VPS Overview
					</h2>
					<p className="mt-1 text-sm font-semibold text-slate-500">
						Servers, health, and applications
					</p>
				</div>
				<span className="inline-flex min-h-8 items-center rounded-full bg-slate-100 px-3 text-sm font-extrabold text-slate-700">
					{servers.length} VPS
				</span>
			</div>

			{servers.length === 0 ? (
				<div className="flex min-h-45 flex-col items-center justify-center gap-2.5 border-dashed border-slate-300 bg-slate-50 text-slate-500">
					<Server size={28} />
					<strong>{emptyTitle}</strong>
				</div>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full min-w-260 border-collapse">
						<thead>
							<tr>
								<th className={headerCellClass}>VPS</th>
								<th className={headerCellClass}>Status</th>
								<th className={headerCellClass}>Apps</th>
								<th className={headerCellClass}>Host</th>
								<th className={headerCellClass}>Memory</th>
								<th className={headerCellClass}>Last seen</th>
								<th className={`${headerCellClass} text-right`}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{servers.map((server) => {
								const isExpanded = expandedIds.has(server.serverId);
								const isScanning = activeScanId === server.serverId;
								const memory = serverMemory(server);

								return (
									<Fragment key={server.serverId}>
										<tr
											className="cursor-pointer hover:bg-blue-50/50"
											onClick={() => toggleServer(server.serverId)}
										>
											<td className={`${bodyCellClass} min-w-68`}>
												<div className="flex items-center gap-2.5">
													<span className="text-slate-400">
														{isExpanded ? (
															<ChevronDown size={16} />
														) : (
															<ChevronRight size={16} />
														)}
													</span>
													<span className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
														{server.online ? (
															<Server size={17} />
														) : (
															<WifiOff size={17} />
														)}
													</span>
													<span className="min-w-0">
														<strong className="block max-w-52 overflow-hidden text-ellipsis text-slate-900">
															{server.serverName}
														</strong>
														<span className="block max-w-52 overflow-hidden text-ellipsis text-xs font-semibold text-slate-500">
															{server.host.hostname}
														</span>
													</span>
												</div>
											</td>
											<td className={bodyCellClass}>
												<StatusBadge status={server.status} />
											</td>
											<td className={bodyCellClass}>
												<strong className="text-slate-900">
													{server.apps.length}
												</strong>
												<span className="ml-1 text-slate-500">apps</span>
											</td>
											<td className={bodyCellClass}>
												<span className="font-semibold text-slate-700">
													{server.host.platform}/{server.host.arch}
												</span>
												<span className="ml-2 text-slate-500">
													{server.host.cpuCount} cores
												</span>
											</td>
											<td className={bodyCellClass}>
												<span className="font-semibold text-slate-700">
													{formatBytes(memory.used)}
												</span>
												<span className="ml-1 text-slate-500">
													/ {formatBytes(server.host.memoryTotalBytes)} (
													{memory.percent}%)
												</span>
											</td>
											<td className={bodyCellClass}>
												<span className="font-semibold text-slate-600">
													{relativeTime(server.lastSeenAt, now)}
												</span>
											</td>
											<td className={`${bodyCellClass} text-right`}>
												<button
													type="button"
													className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
													onClick={(event) => {
														event.stopPropagation();
														onScanServer(server.serverId);
													}}
													disabled={Boolean(activeScanId)}
													aria-label={`Scan ${server.serverName}`}
												>
													{isScanning ? (
														<LoaderCircle size={15} className="animate-spin" />
													) : (
														<RefreshCw size={15} />
													)}
													{isScanning ? "Scanning" : "Scan"}
												</button>
											</td>
										</tr>

										{isExpanded && (
											<tr>
												<td colSpan={7} className="bg-slate-50 p-0">
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
																{formatBytes(server.host.memoryTotalBytes)} (
																{memory.percent}%)
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
												</td>
											</tr>
										)}
									</Fragment>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
}
