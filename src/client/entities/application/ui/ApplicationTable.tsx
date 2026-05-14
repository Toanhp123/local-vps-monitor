import type { AppSnapshot } from "../../../../shared/types";
import { formatBytes } from "../../../shared/lib/format";
import { StatusBadge } from "../../../shared/ui/StatusBadge";
import { RuntimeBadge } from "./RuntimeBadge";

const headerCellClass =
	"border-t border-slate-200 bg-slate-50 px-3.5 py-3 text-left align-middle text-xs font-bold uppercase text-slate-500 whitespace-nowrap";
const bodyCellClass =
	"border-t border-slate-200 px-3.5 py-3 text-left align-middle whitespace-nowrap";

export function ApplicationTable({ apps }: { apps: AppSnapshot[] }) {
	return (
		<div className="overflow-x-auto">
			<table className="w-full min-w-215 border-collapse">
				<thead>
					<tr>
						<th className={headerCellClass}>App</th>
						<th className={headerCellClass}>Runtime</th>
						<th className={headerCellClass}>Status</th>
						<th className={headerCellClass}>CPU</th>
						<th className={headerCellClass}>Memory</th>
						<th className={headerCellClass}>Restarts</th>
						<th className={headerCellClass}>Ports/Image</th>
					</tr>
				</thead>
				<tbody>
					{apps.map((app) => (
						<tr key={app.id}>
							<td className={`${bodyCellClass} min-w-47.5`}>
								<strong>{app.name}</strong>
							</td>
							<td className={bodyCellClass}>
								<RuntimeBadge kind={app.kind} />
							</td>
							<td className={bodyCellClass}>
								<StatusBadge status={app.health} />
								<span className="ml-2 inline-block max-w-45 overflow-hidden text-xs text-ellipsis align-middle text-slate-500">
									{app.status}
								</span>
							</td>
							<td className={bodyCellClass}>
								{app.cpuPercent === undefined
									? "-"
									: `${app.cpuPercent.toFixed(1)}%`}
							</td>
							<td className={bodyCellClass}>
								{formatBytes(app.memoryBytes)}
							</td>
							<td className={bodyCellClass}>
								{app.restarts ?? "-"}
							</td>
							<td
								className={`${bodyCellClass} max-w-75 overflow-hidden text-ellipsis text-slate-500`}
							>
								{app.ports || app.image || "-"}
							</td>
						</tr>
					))}
					{apps.length === 0 && (
						<tr>
							<td
								colSpan={7}
								className="h-18 border-t border-slate-200 text-center text-slate-500"
							>
								No Docker or PM2 apps reported
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
}
