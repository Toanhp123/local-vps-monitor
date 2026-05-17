import { RefreshCw } from "lucide-react";
import type { IncidentEvent } from "../../../../shared/types";
import { IncidentNotificationCenter } from "../../../entities/incident/ui/IncidentNotificationCenter";
import { Button } from "../../../shared/ui/Button";
import { SearchInput } from "../../../shared/ui/SearchInput";

export function DashboardHeader({
	incidents,
	isScanAllDisabled,
	isScanningAll,
	now,
	onScanAll,
	query,
	onQueryChange,
}: {
	incidents: IncidentEvent[];
	isScanAllDisabled: boolean;
	isScanningAll: boolean;
	now: number;
	onScanAll: () => void;
	query: string;
	onQueryChange: (query: string) => void;
}) {
	return (
		<header className="mb-5.5 flex items-end justify-between gap-5 max-md:flex-col max-md:items-stretch">
			<div>
				<h1 className="text-[34px] leading-tight font-extrabold text-slate-900 max-md:text-[28px]">
					Dashboard
				</h1>
				<p className="mt-1 text-sm font-semibold text-slate-500">
					Monitor servers and app health from one local screen
				</p>
			</div>
			<div className="flex flex-wrap items-center justify-end gap-2.5 max-md:w-full">
				<SearchInput
					ariaLabel="Dashboard search"
					className="max-md:w-full max-md:min-w-0"
					onChange={onQueryChange}
					placeholder="Search server, app, runtime"
					value={query}
				/>
				<IncidentNotificationCenter incidents={incidents} now={now} />
				<Button
					className="max-md:flex-1"
					onClick={onScanAll}
					disabled={isScanAllDisabled}
					aria-label="Scan all servers"
					icon={RefreshCw}
					isLoading={isScanningAll}
					size="lg"
					variant="primary"
				>
					{isScanningAll ? "Scanning" : "Scan All"}
				</Button>
			</div>
		</header>
	);
}
