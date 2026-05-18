import { useMemo, useState } from "react";
import { Bell, Download } from "lucide-react";
import { Panel, PanelHeader } from "@/shared/ui/Panel";
import { Button } from "@/shared/ui/Button";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { useMonitorShellContext } from "@/widgets/monitorShell";
import { useIncidentFilters } from "@/widgets/incidentFilters/model/useIncidentFilters";
import { IncidentFilterSidebar } from "@/widgets/incidentFilters/ui/IncidentFilterSidebar";
import { IncidentTable } from "@/widgets/incidentTable/ui/IncidentTable";
import { IncidentTimeline } from "@/widgets/incidentTimeline/ui/IncidentTimeline";
import { useBulkSelection } from "@/features/incidentBulkActions/model/useBulkSelection";
import { BulkActionsToolbar } from "@/features/incidentBulkActions/ui/BulkActionsToolbar";
import { exportIncidentsToCsv } from "@/features/incidentExport/model/exportIncidentsCsv";
import {
	filterIncidents,
	sortIncidents,
} from "@/entities/incident/model/incidentFilters";
import { useIncidentDrawerState } from "@/entities/incident/model/useIncidentDrawerState";
import type { SnoozePreset } from "@/entities/incident/model/incidentState";

type ViewMode = "table" | "timeline";

export function IncidentsPage() {
	const { overview, now } = useMonitorShellContext();
	const [viewMode, setViewMode] = useState<ViewMode>("table");
	const allIncidents = useMemo(
		() => overview?.servers.flatMap((s) => s.incidents) ?? [],
		[overview],
	);

	const {
		acknowledgeIncident,
		clearIncidentState,
		incidentState,
		readIncidentIds,
		snoozeIncident,
		markIncidentsRead,
	} = useIncidentDrawerState(allIncidents, now);

	const {
		filters,
		updateTextSearch,
		toggleSeverity,
		toggleKind,
		toggleServer,
		toggleApp,
		setDateRange,
		setState,
		clearFilters,
	} = useIncidentFilters();

	const filteredIncidents = useMemo(
		() =>
			sortIncidents(
				filterIncidents(
					allIncidents,
					filters,
					readIncidentIds,
					incidentState.acknowledgedIncidentIds,
					new Set(
						Array.from(
							incidentState.snoozedUntilByIncidentId.keys(),
						).filter((id) => {
							const until =
								incidentState.snoozedUntilByIncidentId.get(id);
							return until !== undefined && until > now;
						}),
					),
					now,
				),
				"time",
				"desc",
			),
		[allIncidents, filters, readIncidentIds, incidentState, now],
	);

	const {
		selectedIds,
		toggleSelection,
		toggleAll,
		clearSelection,
		isAllSelected,
		selectedCount,
	} = useBulkSelection(filteredIncidents.map((i) => i.id));

	const servers = useMemo(
		() =>
			Array.from(
				new Map(
					overview?.servers.map((s) => [
						s.serverId,
						{ id: s.serverId, name: s.serverName },
					]),
				).values(),
			),
		[overview],
	);

	const apps = useMemo(() => {
		const appSet = new Set<string>();
		allIncidents.forEach((i) => {
			if (i.appName) appSet.add(i.appName);
		});
		return Array.from(appSet).sort();
	}, [allIncidents]);

	const handleBulkAcknowledge = () => {
		selectedIds.forEach((id) => {
			markIncidentsRead([id]);
			acknowledgeIncident(id);
		});
		clearSelection();
	};

	const handleBulkSnooze = (preset: SnoozePreset) => {
		selectedIds.forEach((id) => {
			markIncidentsRead([id]);
			snoozeIncident(id, preset);
		});
		clearSelection();
	};

	const handleBulkMarkRead = () => {
		markIncidentsRead(Array.from(selectedIds));
		clearSelection();
	};

	const handleBulkExport = () => {
		const selected = filteredIncidents.filter((i) => selectedIds.has(i.id));
		exportIncidentsToCsv(selected);
	};

	const handleBulkClearActions = () => {
		selectedIds.forEach((id) => clearIncidentState(id));
		clearSelection();
	};

	const handleExportAll = () => {
		exportIncidentsToCsv(filteredIncidents);
	};

	return (
		<div className="grid grid-cols-[280px_1fr] gap-4 max-lg:grid-cols-1">
			<div className="rounded-lg border border-slate-200 bg-white p-4">
				<IncidentFilterSidebar
					filters={filters}
					servers={servers}
					apps={apps}
					onTextSearchChange={updateTextSearch}
					onToggleSeverity={toggleSeverity}
					onToggleKind={toggleKind}
					onToggleServer={toggleServer}
					onToggleApp={toggleApp}
					onDateRangeChange={setDateRange}
					onStateChange={setState}
					onClearFilters={clearFilters}
				/>
			</div>

			<Panel>
				<PanelHeader
					icon={Bell}
					title="All Incidents"
					description={`${filteredIncidents.length} incidents`}
					actions={
						<div className="flex items-center gap-2">
							<SegmentedControl
								ariaLabel="View mode"
								value={viewMode}
								onChange={(value) =>
									setViewMode(value as ViewMode)
								}
								options={[
									{ label: "Table", value: "table" },
									{ label: "Timeline", value: "timeline" },
								]}
								size="sm"
							/>
							<Button
								onClick={handleExportAll}
								size="sm"
								icon={Download}
							>
								Export
							</Button>
						</div>
					}
				/>
				<BulkActionsToolbar
					selectedCount={selectedCount}
					onAcknowledge={handleBulkAcknowledge}
					onSnooze={handleBulkSnooze}
					onMarkRead={handleBulkMarkRead}
					onExport={handleBulkExport}
					onClearActions={handleBulkClearActions}
				/>
				{viewMode === "table" ? (
					<IncidentTable
						incidents={filteredIncidents}
						now={now}
						selectedIds={selectedIds}
						onToggleSelection={toggleSelection}
						onToggleAll={toggleAll}
						isAllSelected={isAllSelected}
					/>
				) : (
					<IncidentTimeline incidents={filteredIncidents} now={now} />
				)}
			</Panel>
		</div>
	);
}
