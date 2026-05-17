import type { ReactNode } from "react";
import { Server, WifiOff } from "lucide-react";
import type { StoredServer } from "../../../../shared/types";
import { serverAppCounts } from "../../application/model/appPolicy";
import { formatBytes, relativeTime } from "../../../shared/lib/format";
import { DataTableCell, DataTableRow } from "../../../shared/ui/DataTable";
import { StatusBadge } from "../../../shared/ui/StatusBadge";
import { serverDisk, serverMemory } from "../model/serverMetrics";

export function ServerTableRow({
	actions,
	now,
	onOpen,
	pinControl,
	server,
}: {
	actions: ReactNode;
	now: number;
	onOpen: () => void;
	pinControl?: ReactNode;
	server: StoredServer;
}) {
	const memory = serverMemory(server);
	const disk = serverDisk(server);
	const appCounts = serverAppCounts(server);

	return (
		<DataTableRow className="cursor-pointer hover:bg-blue-50/50" onClick={onOpen}>
			<DataTableCell className="min-w-68">
				<div className="flex items-center gap-2.5">
					{pinControl}
					<span className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
						{server.online ? <Server size={17} /> : <WifiOff size={17} />}
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
			</DataTableCell>
			<DataTableCell>
				<StatusBadge status={server.status} />
			</DataTableCell>
			<DataTableCell>
				<strong className="text-slate-900">{appCounts.monitored}</strong>
				<span className="ml-1 text-slate-500">
					/{appCounts.total} apps
				</span>
			</DataTableCell>
			<DataTableCell>
				<span className="font-semibold text-slate-700">
					{server.host.platform}/{server.host.arch}
				</span>
			</DataTableCell>
			<DataTableCell>
				<span className="font-semibold text-slate-700">
					{server.host.cpuCount}
				</span>
				<span className="ml-1 text-slate-500">cores</span>
			</DataTableCell>
			<DataTableCell>
				<span className="font-semibold text-slate-700">
					{formatBytes(memory.used)}
				</span>
				<span className="ml-1 text-slate-500">
					/ {formatBytes(server.host.memoryTotalBytes)} ({memory.percent}%)
				</span>
			</DataTableCell>
			<DataTableCell>
				{disk ? (
					<>
						<span className="font-semibold text-slate-700">
							{formatBytes(disk.used)}
						</span>
						<span className="ml-1 text-slate-500">
							/ {formatBytes(disk.total)} ({disk.percent}%)
						</span>
					</>
				) : (
					<span className="font-semibold text-slate-400">-</span>
				)}
			</DataTableCell>
			<DataTableCell>
				<span className="font-semibold text-slate-600">
					{relativeTime(server.lastSeenAt, now)}
				</span>
			</DataTableCell>
			<DataTableCell align="right">
				<div className="flex items-center justify-end gap-2">{actions}</div>
			</DataTableCell>
		</DataTableRow>
	);
}
