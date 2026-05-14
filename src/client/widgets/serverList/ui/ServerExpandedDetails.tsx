import { Box, Server, SquareTerminal, WifiOff } from "lucide-react";
import type { StoredServer } from "../../../../shared/types";
import { ApplicationTable } from "../../../entities/application/ui/ApplicationTable";
import { ServerMetricsGrid } from "../../../entities/server/ui/ServerMetricsGrid";
import { StatusBadge } from "../../../shared/ui/StatusBadge";

export function ServerExpandedDetails({ server }: { server: StoredServer }) {
	const dockerApps = server.apps.filter((app) => app.kind === "docker").length;
	const pm2Apps = server.apps.filter((app) => app.kind === "pm2").length;

	return (
		<div className="bg-slate-100 px-3.5 py-3">
			<div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
				<div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 max-md:flex-col max-md:items-stretch">
					<div className="flex min-w-0 items-center gap-2.5">
						<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
							{server.online ? <Server size={18} /> : <WifiOff size={18} />}
						</span>
						<div className="min-w-0">
							<div className="flex min-w-0 flex-wrap items-center gap-2">
								<strong className="max-w-80 overflow-hidden text-ellipsis text-slate-900">
									{server.serverName}
								</strong>
								<StatusBadge status={server.status} />
							</div>
							<span className="mt-0.5 block max-w-100 overflow-hidden text-sm font-semibold text-ellipsis text-slate-500">
								{server.host.hostname}
							</span>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-1.5">
						<span className="inline-flex min-h-7 items-center rounded-full bg-slate-100 px-2.5 text-xs font-extrabold text-slate-700">
							{server.apps.length} apps
						</span>
						<span className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-blue-50 px-2.5 text-xs font-extrabold text-blue-700">
							<Box size={13} />
							{dockerApps}
						</span>
						<span className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 text-xs font-extrabold text-emerald-700">
							<SquareTerminal size={13} />
							{pm2Apps}
						</span>
					</div>
				</div>

				<ServerMetricsGrid server={server} />

				<div className="border-t border-slate-200">
					<div className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-2.5">
						<span className="text-xs font-bold text-slate-500 uppercase">
							Applications on {server.serverName}
						</span>
					</div>
					<ApplicationTable apps={server.apps} />
				</div>
			</div>
		</div>
	);
}
