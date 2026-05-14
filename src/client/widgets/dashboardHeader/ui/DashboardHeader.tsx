import { LoaderCircle, RefreshCw, Search } from "lucide-react";

export function DashboardHeader({
	isScanAllDisabled,
	isScanningAll,
	onScanAll,
	query,
	onQueryChange,
}: {
	isScanAllDisabled: boolean;
	isScanningAll: boolean;
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
				<label className="flex h-10 min-w-72.5 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 max-md:w-full">
					<Search size={16} />
					<input
						className="w-full min-w-0 border-0 text-slate-900 outline-0"
						value={query}
						onChange={(event) => onQueryChange(event.target.value)}
						placeholder="Search server, app, runtime"
					/>
				</label>
				<button
					type="button"
					className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-900 bg-slate-900 px-3.5 font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
					onClick={onScanAll}
					disabled={isScanAllDisabled}
					aria-label="Scan all servers"
				>
					{isScanningAll ? (
						<LoaderCircle size={16} className="animate-spin" />
					) : (
						<RefreshCw size={16} />
					)}
					{isScanningAll ? "Scanning" : "Scan All"}
				</button>
			</div>
		</header>
	);
}
