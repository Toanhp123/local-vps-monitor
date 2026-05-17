import type { ReactNode } from "react";
import type { AppSnapshot } from "@shared/types";
import {
	appDisplayName,
	appImportance,
	isIgnoredApp,
} from "../model/appPolicy";
import { formatBytes } from "@/shared/lib/format";
import {
	DataTable,
	DataTableActionsCell,
	DataTableBody,
	DataTableCell,
	DataTableHeaderRow,
	DataTableMessageRow,
	DataTableRow,
	DataTableTitle,
} from "@/shared/ui/DataTable";
import { Badge } from "@/shared/ui/Badge";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { RuntimeBadge } from "./RuntimeBadge";

const importanceTones = {
	critical: "red",
	ignored: "slate",
	normal: "slate",
} as const;

const importanceBadgeClasses = {
	critical: "",
	ignored: "bg-slate-200",
	normal: "",
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
	const columns = [
		{ key: "app", label: "App" },
		{ key: "runtime", label: "Runtime" },
		{ key: "status", label: "Status" },
		{ key: "cpu", label: "CPU" },
		{ key: "memory", label: "Memory" },
		{ key: "image", label: "Image" },
		{ key: "ports", label: "Ports" },
		...(hasActions
			? [
					{
						align: "right" as const,
						key: "actions",
						label: "Actions",
						stickyRight: true,
					},
				]
			: []),
	];

	return (
		<DataTable>
			<DataTableHeaderRow border="top" columns={columns} tone="subtle" />
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
									<DataTableTitle
										afterTitle={
											importance !== "normal" ? (
												<Badge
													className={
														importanceBadgeClasses[
															importance
														]
													}
													size="xs"
													tone={
														importanceTones[
															importance
														]
													}
												>
													{importanceLabels[importance]}
												</Badge>
											) : undefined
										}
										subtitle={
											displayName !== app.name
												? app.name
												: undefined
										}
										subtitleClassName="text-slate-400"
										title={displayName}
										titleClassName={
											isIgnored
												? "text-slate-500"
												: "text-slate-900"
										}
									/>
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
									<DataTableActionsCell border="top" sticky>
										{actions(app)}
									</DataTableActionsCell>
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
