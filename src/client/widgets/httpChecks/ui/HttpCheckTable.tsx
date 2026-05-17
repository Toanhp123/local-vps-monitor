import { useState } from "react";
import { Activity, Edit3, Play, Trash2 } from "lucide-react";
import type { HttpCheck, StoredServer } from "../../../../shared/types";
import { appDisplayName } from "../../../entities/application/model/appPolicy";
import { relativeTime } from "../../../shared/lib/format";
import { Button } from "../../../shared/ui/Button";
import {
	DataTable,
	DataTableBody,
	DataTableCell,
	DataTableHeader,
	DataTableHeaderCell,
	DataTableMessageRow,
	DataTableRow,
} from "../../../shared/ui/DataTable";

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
		<DataTable>
			<DataTableHeader>
				{["Check", "Target", "Status", "Last run", "Actions"].map(
					(header) => (
						<DataTableHeaderCell
							key={header}
							align={header === "Actions" ? "right" : "left"}
						>
							{header}
						</DataTableHeaderCell>
					),
				)}
			</DataTableHeader>
			<DataTableBody>
					{isLoading ? (
						<DataTableMessageRow
							align="left"
							className="h-auto px-4 py-5 text-sm font-bold"
							colSpan={5}
						>
							Loading HTTP checks
						</DataTableMessageRow>
					) : checks.length === 0 ? (
						<DataTableMessageRow
							align="left"
							className="h-auto px-4 py-5 text-sm font-bold"
							colSpan={5}
						>
							No HTTP checks yet
						</DataTableMessageRow>
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
								<DataTableRow
									key={check.id}
									className="hover:bg-blue-50/50"
								>
									<DataTableCell noWrap={false}>
										<div className="min-w-0">
											<strong className="block max-w-72 overflow-hidden text-ellipsis text-slate-900">
												{check.name}
											</strong>
											<span className="block max-w-96 overflow-hidden text-ellipsis text-xs font-semibold text-slate-500">
												{check.method} {check.url}
											</span>
										</div>
									</DataTableCell>
									<DataTableCell>
										<span className="font-semibold text-slate-700">
											{linkedServer?.serverName || "Standalone"}
										</span>
										{linkedApp && (
											<span className="ml-1 text-slate-500">
												/ {appDisplayName(linkedApp)}
											</span>
										)}
									</DataTableCell>
									<DataTableCell>
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
									</DataTableCell>
									<DataTableCell>
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
									</DataTableCell>
									<DataTableCell align="right">
										<div className="flex justify-end gap-2">
											<Button
												disabled={isRunning}
												icon={Play}
												onClick={() => {
													setPendingDeleteId(null);
													onRunCheck(check.id);
												}}
												size="sm"
											>
												{isRunning ? "Running" : "Run"}
											</Button>
											<Button
												icon={Edit3}
												onClick={() => {
													setPendingDeleteId(null);
													onEditCheck(check);
												}}
												size="sm"
											>
												Edit
											</Button>
											<Button
												icon={Trash2}
												onClick={() => {
													if (pendingDeleteId !== check.id) {
														setPendingDeleteId(check.id);
														return;
													}

													onRemoveCheck(check.id);
													setPendingDeleteId(null);
												}}
												size="sm"
												variant={
													pendingDeleteId === check.id
														? "dangerSoft"
														: "danger"
												}
											>
												{pendingDeleteId === check.id
													? "Confirm"
													: "Delete"}
											</Button>
										</div>
									</DataTableCell>
								</DataTableRow>
							);
						})
					)}
			</DataTableBody>
		</DataTable>
	);
}
