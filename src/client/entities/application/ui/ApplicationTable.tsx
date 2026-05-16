import type { ReactNode } from "react";
import type { AppSnapshot } from "../../../../shared/types";
import {
	appDisplayName,
	appImportance,
	isIgnoredApp,
} from "../model/appMonitoringPolicy";
import { formatBytes } from "../../../shared/lib/format";
import { StatusBadge } from "../../../shared/ui/StatusBadge";
import { RuntimeBadge } from "./RuntimeBadge";

const headerCellClass =
	"border-t border-slate-200 bg-slate-50 px-3.5 py-3 text-left align-middle text-xs font-bold uppercase text-slate-500 whitespace-nowrap";
const bodyCellClass =
	"border-t border-slate-200 px-3.5 py-3 text-left align-middle whitespace-nowrap";
const actionDividerClass =
	"before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-300 before:content-['']";
const actionHeaderCellClass = `${headerCellClass} ${actionDividerClass} sticky right-0 z-20 min-w-36 bg-slate-100 text-right`;
const actionBodyCellClass =
	`sticky right-0 z-10 min-w-36 border-t border-slate-200 bg-slate-50 px-3.5 py-3 text-right align-middle whitespace-nowrap ${actionDividerClass}`;

const importanceClasses = {
	critical: "bg-red-100 text-red-800",
	ignored: "bg-slate-200 text-slate-700",
	normal: "bg-slate-100 text-slate-600",
};

const importanceLabels = {
	critical: "Critical",
	ignored: "Ignored",
	normal: "Normal",
};

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
	const columnCount = 7 + (hasActions ? 1 : 0);

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
						const importance = appImportance(app);
						const displayName = appDisplayName(app);
						const isIgnored = isIgnoredApp(app);

						return (
							<tr
								key={app.id}
								className={isIgnored ? "bg-slate-50/70" : undefined}
							>
								<td className={`${bodyCellClass} min-w-47.5`}>
									<div className="grid gap-1">
										<div className="flex min-w-0 items-center gap-2">
											<strong
												className={
													isIgnored
														? "text-slate-500"
														: "text-slate-900"
												}
											>
												{displayName}
											</strong>
											{importance !== "normal" && (
												<span
													className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${importanceClasses[importance]}`}
												>
													{importanceLabels[importance]}
												</span>
											)}
										</div>
										{displayName !== app.name && (
											<span className="text-xs font-semibold text-slate-400">
												{app.name}
											</span>
										)}
									</div>
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
								colSpan={columnCount}
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
