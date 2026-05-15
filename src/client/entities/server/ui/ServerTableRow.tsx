import type { ReactNode } from "react";
import { Server, WifiOff } from "lucide-react";
import type { StoredServer } from "../../../../shared/types";
import { formatBytes, relativeTime } from "../../../shared/lib/format";
import { StatusBadge } from "../../../shared/ui/StatusBadge";
import { serverMemory } from "../model/serverMetrics";

const bodyCellClass =
	"border-b border-slate-200 px-3.5 py-3 text-left align-middle whitespace-nowrap";

export function ServerTableRow({
	actions,
	now,
	onOpen,
	server,
}: {
	actions: ReactNode;
	now: number;
	onOpen: () => void;
	server: StoredServer;
}) {
	const memory = serverMemory(server);

	return (
		<tr className="cursor-pointer hover:bg-blue-50/50" onClick={onOpen}>
			<td className={`${bodyCellClass} min-w-68`}>
				<div className="flex items-center gap-2.5">
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
			</td>
			<td className={bodyCellClass}>
				<StatusBadge status={server.status} />
			</td>
			<td className={bodyCellClass}>
				<strong className="text-slate-900">{server.apps.length}</strong>
				<span className="ml-1 text-slate-500">apps</span>
			</td>
			<td className={bodyCellClass}>
				<span className="font-semibold text-slate-700">
					{server.host.platform}/{server.host.arch}
				</span>
			</td>
			<td className={bodyCellClass}>
				<span className="font-semibold text-slate-700">
					{server.host.cpuCount}
				</span>
				<span className="ml-1 text-slate-500">cores</span>
			</td>
			<td className={bodyCellClass}>
				<span className="font-semibold text-slate-700">
					{formatBytes(memory.used)}
				</span>
				<span className="ml-1 text-slate-500">
					/ {formatBytes(server.host.memoryTotalBytes)} ({memory.percent}%)
				</span>
			</td>
			<td className={bodyCellClass}>
				<span className="font-semibold text-slate-600">
					{relativeTime(server.lastSeenAt, now)}
				</span>
			</td>
			<td className={`${bodyCellClass} text-right`}>
				<div className="flex items-center justify-end gap-2">{actions}</div>
			</td>
		</tr>
	);
}
