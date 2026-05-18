import { X } from "lucide-react";
import { SearchInput } from "@/shared/ui/SearchInput";
import { Button } from "@/shared/ui/Button";
import type { IncidentFilters } from "@/entities/incident/model/incidentFilters";

const severityOptions = [
	{ label: "Critical", value: "critical" },
	{ label: "Warning", value: "warning" },
	{ label: "Info", value: "info" },
	{ label: "Resolved", value: "resolved" },
];

const kindOptions = [
	{ label: "App Health", value: "app-health" },
	{ label: "App Restart", value: "app-restart" },
	{ label: "CPU Load", value: "cpu-load" },
	{ label: "Memory Usage", value: "memory-usage" },
	{ label: "Disk Usage", value: "disk-usage" },
	{ label: "HTTP Check", value: "http-check" },
	{ label: "App Added", value: "app-added" },
	{ label: "App Removed", value: "app-removed" },
];

const dateRangeOptions = [
	{ label: "Last Hour", value: "1h" as const },
	{ label: "Today", value: "today" as const },
	{ label: "Last 7 Days", value: "7d" as const },
	{ label: "All Time", value: "all" as const },
];

const stateOptions = [
	{ label: "Unread", value: "unread" as const },
	{ label: "Acknowledged", value: "acknowledged" as const },
	{ label: "Snoozed", value: "snoozed" as const },
	{ label: "All", value: "all" as const },
];

export function IncidentFilterSidebar({
	filters,
	servers,
	apps,
	onTextSearchChange,
	onToggleSeverity,
	onToggleKind,
	onToggleServer,
	onToggleApp,
	onDateRangeChange,
	onStateChange,
	onClearFilters,
}: {
	filters: IncidentFilters;
	servers: Array<{ id: string; name: string }>;
	apps: string[];
	onTextSearchChange: (text: string) => void;
	onToggleSeverity: (severity: string) => void;
	onToggleKind: (kind: string) => void;
	onToggleServer: (serverId: string) => void;
	onToggleApp: (appName: string) => void;
	onDateRangeChange: (range: IncidentFilters["dateRange"]) => void;
	onStateChange: (state: IncidentFilters["state"]) => void;
	onClearFilters: () => void;
}) {
	return (
		<aside className="space-y-4">
			<div className="sticky top-0 z-10 space-y-3 border-b border-slate-200 bg-white pb-4">
				<div className="flex items-center justify-between gap-3">
					<h3 className="text-sm font-extrabold text-slate-900">
						Filters
					</h3>
					<Button onClick={onClearFilters} size="sm" icon={X}>
						Clear all
					</Button>
				</div>
				<SearchInput
					ariaLabel="Incident search"
					value={filters.textSearch}
					onChange={onTextSearchChange}
					size="sm"
					placeholder="Search incidents..."
				/>
			</div>

			<div>
				<h3 className="mb-2 text-sm font-extrabold text-slate-900">
					Severity
				</h3>
				<div className="space-y-1.5">
					{severityOptions.map((option) => (
						<label
							key={option.value}
							className="flex cursor-pointer items-center gap-2"
						>
							<input
								type="checkbox"
								checked={filters.severities.has(
									option.value as any,
								)}
								onChange={() => onToggleSeverity(option.value)}
								className="h-4 w-4 rounded border-slate-300"
							/>
							<span className="text-sm text-slate-700">
								{option.label}
							</span>
						</label>
					))}
				</div>
			</div>

			<div>
				<h3 className="mb-2 text-sm font-extrabold text-slate-900">
					Kind
				</h3>
				<div className="space-y-1.5">
					{kindOptions.map((option) => (
						<label
							key={option.value}
							className="flex cursor-pointer items-center gap-2"
						>
							<input
								type="checkbox"
								checked={filters.kinds.has(option.value as any)}
								onChange={() => onToggleKind(option.value)}
								className="h-4 w-4 rounded border-slate-300"
							/>
							<span className="text-sm text-slate-700">
								{option.label}
							</span>
						</label>
					))}
				</div>
			</div>

			<div>
				<h3 className="mb-2 text-sm font-extrabold text-slate-900">
					Server
				</h3>
				<div className="max-h-40 space-y-1.5 overflow-y-auto">
					{servers.map((server) => (
						<label
							key={server.id}
							className="flex cursor-pointer items-center gap-2"
						>
							<input
								type="checkbox"
								checked={filters.serverIds.has(server.id)}
								onChange={() => onToggleServer(server.id)}
								className="h-4 w-4 rounded border-slate-300"
							/>
							<span className="text-sm text-slate-700">
								{server.name}
							</span>
						</label>
					))}
				</div>
			</div>

			<div>
				<h3 className="mb-2 text-sm font-extrabold text-slate-900">
					App
				</h3>
				<div className="max-h-40 space-y-1.5 overflow-y-auto">
					{apps.map((app) => (
						<label
							key={app}
							className="flex cursor-pointer items-center gap-2"
						>
							<input
								type="checkbox"
								checked={filters.appNames.has(app)}
								onChange={() => onToggleApp(app)}
								className="h-4 w-4 rounded border-slate-300"
							/>
							<span className="text-sm text-slate-700">
								{app}
							</span>
						</label>
					))}
				</div>
			</div>

			<div>
				<h3 className="mb-2 text-sm font-extrabold text-slate-900">
					Date Range
				</h3>
				<div className="space-y-1.5">
					{dateRangeOptions.map((option) => (
						<label
							key={option.value}
							className="flex cursor-pointer items-center gap-2"
						>
							<input
								type="radio"
								checked={filters.dateRange === option.value}
								onChange={() => onDateRangeChange(option.value)}
								className="h-4 w-4 border-slate-300"
							/>
							<span className="text-sm text-slate-700">
								{option.label}
							</span>
						</label>
					))}
				</div>
			</div>

			<div>
				<h3 className="mb-2 text-sm font-extrabold text-slate-900">
					State
				</h3>
				<div className="space-y-1.5">
					{stateOptions.map((option) => (
						<label
							key={option.value}
							className="flex cursor-pointer items-center gap-2"
						>
							<input
								type="radio"
								checked={filters.state === option.value}
								onChange={() => onStateChange(option.value)}
								className="h-4 w-4 border-slate-300"
							/>
							<span className="text-sm text-slate-700">
								{option.label}
							</span>
						</label>
					))}
				</div>
			</div>

		</aside>
	);
}
