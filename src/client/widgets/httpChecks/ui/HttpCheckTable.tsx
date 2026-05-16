import { useState } from "react";
import { Activity, Edit3, Play, Trash2 } from "lucide-react";
import type { HttpCheck, StoredServer } from "../../../../shared/types";
import { relativeTime } from "../../../shared/lib/format";

const statusClasses: Record<string, string> = {
	down: "bg-red-100 text-red-800",
	healthy: "bg-green-100 text-green-800",
	unknown: "bg-slate-100 text-slate-600",
	warning: "bg-amber-100 text-amber-800",
};

export function HttpCheckTable({
	activeCheckId,
	checks,
	isLoading,
	now,
	onEditCheck,
	onRemoveCheck,
	onRunCheck,
	servers,
}: {
	activeCheckId: string | null;
	checks: HttpCheck[];
	isLoading: boolean;
	now: number;
	onEditCheck: (check: HttpCheck) => void;
	onRemoveCheck: (checkId: string) => void;
	onRunCheck: (checkId: string) => void;
	servers: StoredServer[];
}) {
	const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

	return (
		<div className="overflow-x-auto">
			<table className="w-full min-w-250 border-collapse">
				<thead>
					<tr>
						{["Check", "Target", "Status", "Last run", "Actions"].map(
							(header) => (
								<th
									key={header}
									className="border-b border-slate-200 bg-white px-3.5 py-3 text-left text-xs font-bold text-slate-500 uppercase whitespace-nowrap"
								>
									{header}
								</th>
							),
						)}
					</tr>
				</thead>
				<tbody>
					{isLoading ? (
						<tr>
							<td
								className="px-4 py-5 text-sm font-bold text-slate-500"
								colSpan={5}
							>
								Loading HTTP checks
							</td>
						</tr>
					) : checks.length === 0 ? (
						<tr>
							<td
								className="px-4 py-5 text-sm font-bold text-slate-500"
								colSpan={5}
							>
								No HTTP checks yet
							</td>
						</tr>
					) : (
						checks.map((check) => {
							const result = check.lastResult;
							const status = result?.status ?? "unknown";
							const linkedServer = servers.find(
								(server) => server.serverId === check.serverId,
							);
							const linkedApp = linkedServer?.apps.find(
								(app) => app.id === check.appId,
							);
							const isRunning = activeCheckId === check.id;

							return (
								<tr key={check.id} className="hover:bg-blue-50/50">
									<td className="border-b border-slate-200 px-3.5 py-3 align-middle">
										<div className="min-w-0">
											<strong className="block max-w-72 overflow-hidden text-ellipsis text-slate-900">
												{check.name}
											</strong>
											<span className="block max-w-96 overflow-hidden text-ellipsis text-xs font-semibold text-slate-500">
												{check.method} {check.url}
											</span>
										</div>
									</td>
									<td className="border-b border-slate-200 px-3.5 py-3 align-middle whitespace-nowrap">
										<span className="font-semibold text-slate-700">
											{linkedServer?.serverName || "Standalone"}
										</span>
										{linkedApp && (
											<span className="ml-1 text-slate-500">
												/ {linkedApp.name}
											</span>
										)}
									</td>
									<td className="border-b border-slate-200 px-3.5 py-3 align-middle whitespace-nowrap">
										<span
											className={`inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-extrabold ${statusClasses[status]}`}
										>
											<Activity size={14} />
											{status}
										</span>
										{result?.statusCode !== undefined && (
											<span className="ml-2 text-xs font-bold text-slate-500">
												{result.statusCode}
											</span>
										)}
									</td>
									<td className="border-b border-slate-200 px-3.5 py-3 align-middle whitespace-nowrap">
										{result ? (
											<>
												<span className="font-semibold text-slate-700">
													{relativeTime(result.checkedAt, now)}
												</span>
												{result.latencyMs !== undefined && (
													<span className="ml-2 text-xs font-bold text-slate-500">
														{result.latencyMs}ms
													</span>
												)}
												{result.error && (
													<span className="block max-w-72 overflow-hidden text-ellipsis text-xs font-semibold text-rose-600">
														{result.error}
													</span>
												)}
											</>
										) : (
											<span className="font-semibold text-slate-400">
												Never
											</span>
										)}
									</td>
									<td className="border-b border-slate-200 px-3.5 py-3 text-right align-middle whitespace-nowrap">
										<div className="flex justify-end gap-2">
											<button
												type="button"
												className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-extrabold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
												disabled={isRunning}
												onClick={() => {
													setPendingDeleteId(null);
													onRunCheck(check.id);
												}}
											>
												<Play size={14} />
												{isRunning ? "Running" : "Run"}
											</button>
											<button
												type="button"
												className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-extrabold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
												onClick={() => {
													setPendingDeleteId(null);
													onEditCheck(check);
												}}
											>
												<Edit3 size={14} />
												Edit
											</button>
											<button
												type="button"
												className={`inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-xs font-extrabold ${
													pendingDeleteId === check.id
														? "border-rose-200 bg-rose-50 text-rose-700"
														: "border-slate-200 bg-white text-rose-700 hover:border-rose-200 hover:bg-rose-50"
												}`}
												onClick={() => {
													if (pendingDeleteId !== check.id) {
														setPendingDeleteId(check.id);
														return;
													}

													onRemoveCheck(check.id);
													setPendingDeleteId(null);
												}}
											>
												<Trash2 size={14} />
												{pendingDeleteId === check.id
													? "Confirm"
													: "Delete"}
											</button>
										</div>
									</td>
								</tr>
							);
						})
					)}
				</tbody>
			</table>
		</div>
	);
}
