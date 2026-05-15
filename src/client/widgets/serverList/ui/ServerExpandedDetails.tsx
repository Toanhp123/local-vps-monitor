import { Box, Server, SquareTerminal, WifiOff } from "lucide-react";
import type { StoredServer } from "../../../../shared/types";
import {
	appGroupSourceLabels,
	groupApplications,
} from "../../../entities/application/model/groupApplications";
import { ApplicationTable } from "../../../entities/application/ui/ApplicationTable";
import { ServerMetricsGrid } from "../../../entities/server/ui/ServerMetricsGrid";
import { StatusBadge } from "../../../shared/ui/StatusBadge";

export function ServerExpandedDetails({ server }: { server: StoredServer }) {
	const dockerApps = server.apps.filter(
		(app) => app.kind === "docker",
	).length;
	const pm2Apps = server.apps.filter((app) => app.kind === "pm2").length;
	const appGroups = groupApplications(server.apps);

	return (
		<div className="bg-slate-100 px-3.5 py-3">
			<div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
				<div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 max-md:flex-col max-md:items-stretch">
					<div className="flex min-w-0 items-center gap-2.5">
						<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
							{server.online ? (
								<Server size={18} />
							) : (
								<WifiOff size={18} />
							)}
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
							Application groups on {server.serverName}
						</span>
					</div>
					{appGroups.length > 0 ? (
						<div className="grid gap-3 bg-slate-50 p-3">
							{appGroups.map((group) => {
								const GroupIcon =
									group.source === "pm2"
										? SquareTerminal
										: Box;

								return (
									<div
										key={group.id}
										className="overflow-hidden rounded-lg border border-slate-200 bg-white"
									>
										<div className="flex items-center justify-between gap-3 border-b border-slate-200 px-3.5 py-3 max-md:flex-col max-md:items-stretch">
											<div className="flex min-w-0 items-center gap-2.5">
												<span className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
													<GroupIcon size={17} />
												</span>
												<div className="min-w-0">
													<strong className="block max-w-100 overflow-hidden text-ellipsis text-slate-900">
														{group.name}
													</strong>
													<span className="mt-0.5 block text-xs font-bold text-slate-500 uppercase">
														{
															appGroupSourceLabels[
																group.source
															]
														}
													</span>
												</div>
											</div>

											<div className="flex flex-wrap items-center gap-1.5">
												<StatusBadge
													status={group.status}
												/>
												<span className="inline-flex min-h-7 items-center rounded-full bg-slate-100 px-2.5 text-xs font-extrabold text-slate-700">
													{group.apps.length} apps
												</span>
												{group.dockerCount > 0 && (
													<span className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-blue-50 px-2.5 text-xs font-extrabold text-blue-700">
														<Box size={13} />
														{group.dockerCount}
													</span>
												)}
												{group.pm2Count > 0 && (
													<span className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 text-xs font-extrabold text-emerald-700">
														<SquareTerminal
															size={13}
														/>
														{group.pm2Count}
													</span>
												)}
											</div>
										</div>

										<ApplicationTable apps={group.apps} />
									</div>
								);
							})}
						</div>
					) : (
						<ApplicationTable apps={[]} />
					)}
				</div>
			</div>
		</div>
	);
}
