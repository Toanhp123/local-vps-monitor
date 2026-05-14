import { Fragment, useState } from "react";
import type { StoredServer } from "../../../../shared/types";
import { ApplicationTable } from "../../../entities/application/ui/ApplicationTable";
import { ServerMetricsGrid } from "../../../entities/server/ui/ServerMetricsGrid";
import { ServerTableRow } from "../../../entities/server/ui/ServerTableRow";
import { ServerListEmptyState } from "./ServerListEmptyState";
import { ServerTableHeader } from "./ServerTableHeader";

export function ServerList({
	activeScanId,
	hasActiveFilter,
	now,
	onScanServer,
	query,
	servers,
}: {
	activeScanId: string | null;
	hasActiveFilter: boolean;
	now: number;
	onScanServer: (serverId: string) => void;
	query: string;
	servers: StoredServer[];
}) {
	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
	const emptyTitle = query.trim()
		? "No matching servers"
		: hasActiveFilter
			? "No VPS in this view"
			: "No servers yet";

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
		<section
			id="vps"
			className="scroll-mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white"
		>
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
				<ServerListEmptyState title={emptyTitle} />
			) : (
				<div className="overflow-x-auto">
					<table className="w-full min-w-260 border-collapse">
						<ServerTableHeader />
						<tbody>
							{servers.map((server) => {
								const isExpanded = expandedIds.has(server.serverId);
								const isScanning = activeScanId === server.serverId;

								return (
									<Fragment key={server.serverId}>
										<ServerTableRow
											isExpanded={isExpanded}
											isScanDisabled={Boolean(activeScanId)}
											isScanning={isScanning}
											now={now}
											onScan={() => onScanServer(server.serverId)}
											onToggle={() => toggleServer(server.serverId)}
											server={server}
										/>

										{isExpanded && (
											<tr>
												<td colSpan={8} className="bg-slate-50 p-0">
													<ServerMetricsGrid server={server} />
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
