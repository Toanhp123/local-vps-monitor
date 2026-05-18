import type { IncidentEvent } from "@shared/types";
import {
	DataTable,
	DataTableBody,
	DataTableCell,
	DataTableHeader,
	DataTableHeaderCell,
	DataTableRow,
} from "@/shared/ui/DataTable";
import { Badge } from "@/shared/ui/Badge";
import { relativeTime } from "@/shared/lib/format";

const severityTones: Record<string, "amber" | "blue" | "green" | "red"> = {
	critical: "red",
	warning: "amber",
	info: "blue",
	resolved: "green",
};

export function IncidentTable({
	incidents,
	now,
	selectedIds,
	onToggleSelection,
	onToggleAll,
	isAllSelected,
}: {
	incidents: IncidentEvent[];
	now: number;
	selectedIds: Set<string>;
	onToggleSelection: (id: string) => void;
	onToggleAll: () => void;
	isAllSelected: boolean;
}) {
	if (incidents.length === 0) {
		return (
			<div className="flex min-h-44 items-center justify-center text-sm text-slate-500">
				No incidents found
			</div>
		);
	}

	return (
		<DataTable>
			<DataTableHeader>
				<DataTableHeaderCell>
					<input
						type="checkbox"
						checked={isAllSelected}
						onChange={onToggleAll}
						className="h-4 w-4 rounded border-slate-300"
					/>
				</DataTableHeaderCell>
				<DataTableHeaderCell>Time</DataTableHeaderCell>
				<DataTableHeaderCell>Severity</DataTableHeaderCell>
				<DataTableHeaderCell>Server</DataTableHeaderCell>
				<DataTableHeaderCell>App</DataTableHeaderCell>
				<DataTableHeaderCell>Kind</DataTableHeaderCell>
				<DataTableHeaderCell>Message</DataTableHeaderCell>
			</DataTableHeader>
			<DataTableBody>
				{incidents.map((incident) => (
					<DataTableRow key={incident.id}>
						<DataTableCell>
							<input
								type="checkbox"
								checked={selectedIds.has(incident.id)}
								onChange={() => onToggleSelection(incident.id)}
								className="h-4 w-4 rounded border-slate-300"
							/>
						</DataTableCell>
						<DataTableCell>
							<span className="text-xs text-slate-600">
								{relativeTime(incident.occurredAt, now)}
							</span>
						</DataTableCell>
						<DataTableCell>
							<Badge tone={severityTones[incident.severity]}>
								{incident.severity}
							</Badge>
						</DataTableCell>
						<DataTableCell>
							<span className="font-semibold text-slate-900">
								{incident.serverName}
							</span>
						</DataTableCell>
						<DataTableCell>
							<span className="text-slate-700">{incident.appName || "-"}</span>
						</DataTableCell>
						<DataTableCell>
							<span className="text-xs text-slate-600">{incident.kind}</span>
						</DataTableCell>
						<DataTableCell>
							<span className="text-sm text-slate-700">{incident.message}</span>
						</DataTableCell>
					</DataTableRow>
				))}
			</DataTableBody>
		</DataTable>
	);
}
