import { LoaderCircle, RefreshCw, X } from "lucide-react";
import type { AppLogsResponse, AppSnapshot } from "../../../../shared/types";
import { RuntimeBadge } from "../../../entities/application/ui/RuntimeBadge";

const fetchedAtLabel = (value?: string) => {
	if (!value) return "";

	const date = new Date(value);
	if (!Number.isFinite(date.getTime())) return "";

	return date.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
};

export function AppLogsPanel({
	app,
	error,
	isLoading,
	isOpen,
	lineCount,
	logs,
	onClose,
	onLineCountChange,
	onRefresh,
}: {
	app: AppSnapshot | null;
	error: string;
	isLoading: boolean;
	isOpen: boolean;
	lineCount: number;
	logs: AppLogsResponse | null;
	onClose: () => void;
	onLineCountChange: (lineCount: number) => void;
	onRefresh: () => void;
}) {
	if (!isOpen || !app) return null;

	return (
		<div className="fixed inset-0 z-50 overscroll-none bg-slate-950/35">
			<section className="ml-auto flex h-full w-[min(980px,100vw)] overscroll-none flex-col bg-white shadow-2xl">
				<header className="flex items-start justify-between gap-3 border-b border-slate-200 px-4.5 py-4">
					<div className="min-w-0">
						<div className="flex min-w-0 flex-wrap items-center gap-2">
							<h2 className="max-w-150 overflow-hidden text-ellipsis text-lg leading-tight font-extrabold text-slate-900">
								{app.name}
							</h2>
							<RuntimeBadge kind={app.kind} />
						</div>
						<div className="mt-1 flex flex-wrap gap-1.5 text-xs font-bold text-slate-500">
							<span>{logs ? `${logs.lines} lines` : "Logs"}</span>
							{logs?.fetchedAt && (
								<span>
									Fetched {fetchedAtLabel(logs.fetchedAt)}
								</span>
							)}
						</div>
					</div>

					<div className="flex items-center gap-2">
						<select
							className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm font-bold text-slate-700 outline-0"
							value={lineCount}
							onChange={(event) =>
								onLineCountChange(Number(event.target.value))
							}
							disabled={isLoading}
						>
							<option value={100}>100 lines</option>
							<option value={200}>200 lines</option>
							<option value={500}>500 lines</option>
						</select>
						<button
							type="button"
							className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
							onClick={onRefresh}
							disabled={isLoading}
						>
							{isLoading ? (
								<LoaderCircle
									size={15}
									className="animate-spin"
								/>
							) : (
								<RefreshCw size={15} />
							)}
							Refresh
						</button>
						<button
							type="button"
							className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
							onClick={onClose}
							aria-label="Close logs"
						>
							<X size={16} />
						</button>
					</div>
				</header>

				<div className="min-h-0 flex-1 overscroll-contain bg-slate-950 p-4">
					{isLoading && !logs ? (
						<div className="flex h-full items-center justify-center gap-2 text-sm font-bold text-slate-300">
							<LoaderCircle size={16} className="animate-spin" />
							Loading logs
						</div>
					) : error ? (
						<div className="rounded-lg border border-rose-500/40 bg-rose-950/50 p-3 text-sm font-bold text-rose-100">
							{error}
						</div>
					) : logs?.content ? (
						<pre className="h-full overflow-auto overscroll-contain whitespace-pre-wrap wrap-break-word rounded-lg bg-slate-950 font-mono text-xs leading-5 text-slate-100">
							{logs.content}
						</pre>
					) : (
						<div className="flex h-full items-center justify-center text-sm font-bold text-slate-400">
							No logs returned
						</div>
					)}
				</div>
			</section>
		</div>
	);
}
