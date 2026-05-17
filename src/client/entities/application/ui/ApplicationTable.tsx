import type { ReactNode } from "react";
import type { AppSnapshot } from "../../../../shared/types";
import {
	appDisplayName,
	appImportance,
	isIgnoredApp,
} from "../model/appPolicy";
import { formatBytes } from "../../../shared/lib/format";
import {
	DataTable,
	DataTableBody,
	DataTableCell,
	DataTableHeader,
	DataTableHeaderCell,
	DataTableMessageRow,
	DataTableRow,
} from "../../../shared/ui/DataTable";
import { StatusBadge } from "../../../shared/ui/StatusBadge";
import { RuntimeBadge } from "./RuntimeBadge";

const actionDividerClass =
	"before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-300 before:content-['']";

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
		<DataTable>
			<DataTableHeader>
				<DataTableHeaderCell border="top" tone="subtle">
					App
				</DataTableHeaderCell>
				<DataTableHeaderCell border="top" tone="subtle">
					Runtime
				</DataTableHeaderCell>
				<DataTableHeaderCell border="top" tone="subtle">
					Status
				</DataTableHeaderCell>
				<DataTableHeaderCell border="top" tone="subtle">
					CPU
				</DataTableHeaderCell>
				<DataTableHeaderCell border="top" tone="subtle">
					Memory
				</DataTableHeaderCell>
				<DataTableHeaderCell border="top" tone="subtle">
					Image
				</DataTableHeaderCell>
				<DataTableHeaderCell border="top" tone="subtle">
					Ports
				</DataTableHeaderCell>
				{hasActions && (
					<DataTableHeaderCell
						align="right"
						border="top"
						className={`${actionDividerClass} sticky right-0 z-20 min-w-36 bg-slate-100`}
						tone="subtle"
					>
						Actions
					</DataTableHeaderCell>
				)}
			</DataTableHeader>
			<DataTableBody>
					{apps.map((app) => {
						const ports = portItems(app.ports);
						const statusText = displayStatusText(app.status);
						const importance = appImportance(app);
						const displayName = appDisplayName(app);
						const isIgnored = isIgnoredApp(app);

						return (
							<DataTableRow
								key={app.id}
								className={isIgnored ? "bg-slate-50/70" : undefined}
							>
								<DataTableCell border="top" className="min-w-47.5">
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
								</DataTableCell>
								<DataTableCell border="top">
									<RuntimeBadge kind={app.kind} />
								</DataTableCell>
								<DataTableCell border="top">
									<StatusBadge status={app.health} />
									<span
										className="ml-2 inline-block max-w-45 overflow-hidden text-xs text-ellipsis align-middle text-slate-500"
										title={app.status}
									>
										{statusText || app.status}
									</span>
								</DataTableCell>
								<DataTableCell border="top">
									{app.cpuPercent === undefined
										? "-"
										: `${app.cpuPercent.toFixed(1)}%`}
								</DataTableCell>
								<DataTableCell border="top">
									{formatBytes(app.memoryBytes)}
								</DataTableCell>
								<DataTableCell
									border="top"
									className="max-w-62 overflow-hidden text-ellipsis font-mono text-xs text-slate-500"
									title={app.image}
								>
									{app.image || "-"}
								</DataTableCell>
								<DataTableCell
									border="top"
									className="min-w-80 text-slate-500"
									noWrap={false}
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
								</DataTableCell>
								{actions && (
									<DataTableCell
										align="right"
										border="top"
										className={`${actionDividerClass} sticky right-0 z-10 min-w-36 bg-slate-50`}
									>
										{actions(app)}
									</DataTableCell>
								)}
							</DataTableRow>
						);
					})}
					{apps.length === 0 && (
						<DataTableMessageRow border="top" colSpan={columnCount}>
							No Docker or PM2 apps reported
						</DataTableMessageRow>
					)}
			</DataTableBody>
		</DataTable>
	);
}
