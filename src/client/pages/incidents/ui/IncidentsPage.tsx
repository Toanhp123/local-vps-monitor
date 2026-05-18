import { useEffect, useMemo, useState } from "react";
import { Bell, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Panel, PanelHeader } from "@/shared/ui/Panel";
import { Button } from "@/shared/ui/Button";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { SelectField } from "@/shared/ui/SelectField";
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
type PaginationItem = number | "ellipsis-left" | "ellipsis-right";

const pageSizeOptions = [
	{ label: "10 / page", value: "10" },
	{ label: "25 / page", value: "25" },
	{ label: "50 / page", value: "50" },
];

const getPaginationItems = (
	currentPage: number,
	pageCount: number,
): PaginationItem[] => {
	if (pageCount <= 7) {
		return Array.from({ length: pageCount }, (_, index) => index + 1);
	}

	if (currentPage <= 4) {
		return [1, 2, 3, 4, 5, "ellipsis-right", pageCount];
	}

	if (currentPage >= pageCount - 3) {
		return [
			1,
			"ellipsis-left",
			pageCount - 4,
			pageCount - 3,
			pageCount - 2,
			pageCount - 1,
			pageCount,
		];
	}

	return [
		1,
		"ellipsis-left",
		currentPage - 1,
		currentPage,
		currentPage + 1,
		"ellipsis-right",
		pageCount,
	];
};

export function IncidentsPage() {
	const { overview, now } = useMonitorShellContext();
	const [viewMode, setViewMode] = useState<ViewMode>("table");
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
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

	const pageCount = Math.max(
		1,
		Math.ceil(filteredIncidents.length / pageSize),
	);
	const visiblePage = Math.min(currentPage, pageCount);
	const pageStartIndex = (visiblePage - 1) * pageSize;
	const pageEndIndex = Math.min(
		pageStartIndex + pageSize,
		filteredIncidents.length,
	);
	const paginatedIncidents = useMemo(
		() => filteredIncidents.slice(pageStartIndex, pageEndIndex),
		[filteredIncidents, pageEndIndex, pageStartIndex],
	);
	const paginatedIncidentIds = useMemo(
		() => paginatedIncidents.map((incident) => incident.id),
		[paginatedIncidents],
	);
	const paginationItems = useMemo(
		() => getPaginationItems(visiblePage, pageCount),
		[pageCount, visiblePage],
	);

	useEffect(() => {
		setCurrentPage(1);
	}, [
		filters.appNames,
		filters.dateRange,
		filters.kinds,
		filters.serverIds,
		filters.severities,
		filters.state,
		filters.textSearch,
		pageSize,
		viewMode,
	]);

	useEffect(() => {
		setCurrentPage((page) => Math.min(page, pageCount));
	}, [pageCount]);

	const {
		selectedIds,
		toggleSelection,
		toggleAll,
		clearSelection,
		isAllSelected,
		selectedCount,
	} = useBulkSelection(paginatedIncidentIds);

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
		<div className="grid min-h-0 grid-cols-[280px_1fr] gap-4 max-lg:grid-cols-1">
			<div className="max-h-[calc(100vh-3.5rem)] min-h-0 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 max-lg:max-h-none">
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

			<Panel className="flex max-h-[calc(100vh-3.5rem)] min-h-0 flex-col max-lg:max-h-none">
				<PanelHeader
					icon={Bell}
					title="All Incidents"
					description={
						filteredIncidents.length === 0
							? "0 incidents"
							: `${pageStartIndex + 1}-${pageEndIndex} of ${
									filteredIncidents.length
								} incidents`
					}
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
				<div className="min-h-0 flex-1 overflow-auto">
					{viewMode === "table" ? (
						<IncidentTable
							incidents={paginatedIncidents}
							now={now}
							selectedIds={selectedIds}
							onToggleSelection={toggleSelection}
							onToggleAll={toggleAll}
							isAllSelected={isAllSelected}
						/>
					) : (
						<IncidentTimeline incidents={paginatedIncidents} now={now} />
					)}
				</div>
				<div className="flex min-h-14 items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 max-md:flex-col max-md:items-stretch">
					<div className="text-sm font-semibold text-slate-500">
						{filteredIncidents.length === 0
							? "No incidents"
							: `Page ${visiblePage} of ${pageCount}`}
					</div>
					<div className="flex flex-wrap items-center justify-end gap-2 max-md:justify-start">
						<div className="w-30">
							<SelectField
								ariaLabel="Incidents per page"
								value={String(pageSize)}
								onChange={(value) => setPageSize(Number(value))}
								options={pageSizeOptions}
								buttonClassName="inline-flex h-8 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-left text-xs font-bold text-slate-800 outline-0 hover:border-blue-200 hover:bg-blue-50"
							/>
						</div>
						<Button
							onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
							disabled={visiblePage <= 1}
							size="sm"
							icon={ChevronLeft}
						>
							Prev
						</Button>
						<div className="flex max-w-full items-center gap-1 overflow-x-auto">
							{paginationItems.map((item) =>
								typeof item === "number" ? (
									<button
										key={item}
										type="button"
										onClick={() => setCurrentPage(item)}
										className={`flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg border px-2 text-xs font-extrabold ${
											item === visiblePage
												? "border-slate-900 bg-slate-900 text-white"
												: "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
										}`}
										aria-current={item === visiblePage ? "page" : undefined}
										aria-label={`Go to page ${item}`}
									>
										{item}
									</button>
								) : (
									<span
										key={item}
										className="flex h-8 min-w-6 items-center justify-center text-xs font-extrabold text-slate-400"
										aria-hidden="true"
									>
										...
									</span>
								),
							)}
						</div>
						<Button
							onClick={() =>
								setCurrentPage((page) => Math.min(pageCount, page + 1))
							}
							disabled={visiblePage >= pageCount}
							size="sm"
							icon={ChevronRight}
						>
							Next
						</Button>
					</div>
				</div>
			</Panel>
		</div>
	);
}
