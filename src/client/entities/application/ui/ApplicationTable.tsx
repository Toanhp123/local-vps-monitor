import type { ReactNode } from "react";
import type { AppSnapshot } from "../../../../shared/types";
import { formatBytes } from "../../../shared/lib/format";
import { StatusBadge } from "../../../shared/ui/StatusBadge";
import { RuntimeBadge } from "./RuntimeBadge";

const headerCellClass =
	"border-t border-slate-200 bg-slate-50 px-3.5 py-3 text-left align-middle text-xs font-bold uppercase text-slate-500 whitespace-nowrap";
const bodyCellClass =
	"border-t border-slate-200 px-3.5 py-3 text-left align-middle whitespace-nowrap";
const actionHeaderCellClass = `${headerCellClass} sticky right-0 z-20 min-w-28 text-right shadow-[-12px_0_16px_-16px_rgba(15,23,42,0.55)]`;
const actionBodyCellClass =
	"sticky right-0 z-10 min-w-28 border-t border-slate-200 bg-white px-3.5 py-3 text-right align-middle whitespace-nowrap shadow-[-12px_0_16px_-16px_rgba(15,23,42,0.55)]";

const portItems = (ports?: string) => {
	return ports
		?.split(",")
		.map((port) => port.trim())
		.filter(Boolean);
};

const displayStatusText = (status: string) => {
	return status.replace(/\s+\((healthy|unhealthy)\)$/i, "").trim();
};

export function ApplicationTable({
	actions,
	apps,
}: {
	actions?: (app: AppSnapshot) => ReactNode;
	apps: AppSnapshot[];
}) {
	const hasActions = Boolean(actions);

	return (
		<div className="overflow-x-auto">
			<table className="w-full min-w-250 border-collapse">
				<thead>
					<tr>
						<th className={headerCellClass}>App</th>
						<th className={headerCellClass}>Runtime</th>
						<th className={headerCellClass}>Status</th>
						<th className={headerCellClass}>CPU</th>
						<th className={headerCellClass}>Memory</th>
						<th className={headerCellClass}>Image</th>
						<th className={headerCellClass}>Ports</th>
						{hasActions && (
							<th className={actionHeaderCellClass}>Actions</th>
						)}
					</tr>
				</thead>
				<tbody>
					{apps.map((app) => {
						const ports = portItems(app.ports);
						const statusText = displayStatusText(app.status);

						return (
							<tr key={app.id}>
								<td className={`${bodyCellClass} min-w-47.5`}>
									<strong>{app.name}</strong>
								</td>
								<td className={bodyCellClass}>
									<RuntimeBadge kind={app.kind} />
								</td>
								<td className={bodyCellClass}>
									<StatusBadge status={app.health} />
									<span
										className="ml-2 inline-block max-w-45 overflow-hidden text-xs text-ellipsis align-middle text-slate-500"
										title={app.status}
									>
										{statusText || app.status}
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
								<td
									className={`${bodyCellClass} max-w-62 overflow-hidden text-ellipsis font-mono text-xs text-slate-500`}
									title={app.image}
								>
									{app.image || "-"}
								</td>
								<td
									className="min-w-80 border-t border-slate-200 px-3.5 py-3 text-left align-middle text-slate-500"
									title={app.ports}
								>
									{ports && ports.length > 0 ? (
										<div className="flex max-w-115 flex-wrap gap-1.5">
											{ports.map((port) => (
												<span
													key={port}
													className="max-w-full rounded-md bg-slate-100 px-2 py-1 font-mono text-xs break-all text-slate-600"
												>
													{port}
												</span>
											))}
										</div>
									) : (
										"-"
									)}
								</td>
								{actions && (
									<td className={actionBodyCellClass}>
										{actions(app)}
									</td>
								)}
							</tr>
						);
					})}
					{apps.length === 0 && (
						<tr>
							<td
								colSpan={hasActions ? 8 : 7}
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
