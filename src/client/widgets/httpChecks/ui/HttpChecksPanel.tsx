import { useMemo, useState } from "react";
import { CheckCircle2, Globe2, LoaderCircle, Play, XCircle } from "lucide-react";
import type {
	HttpCheck,
	HttpCheckCreateInput,
	HttpCheckUpdateInput,
	OverviewResponse,
} from "../../../../shared/types";
import { HttpCheckForm } from "./HttpCheckForm";
import { HttpCheckTable } from "./HttpCheckTable";

export function HttpChecksPanel({
	activeCheckId,
	checks,
	error,
	isLoading,
	isRunningAll,
	isSaving,
	now,
	onAddCheck,
	onEditCheck,
	onRemoveCheck,
	onRunAllChecks,
	onRunCheck,
	overview,
}: {
	activeCheckId: string | null;
	checks: HttpCheck[];
	error: string;
	isLoading: boolean;
	isRunningAll: boolean;
	isSaving: boolean;
	now: number;
	onAddCheck: (input: HttpCheckCreateInput) => Promise<boolean>;
	onEditCheck: (checkId: string, input: HttpCheckUpdateInput) => Promise<boolean>;
	onRemoveCheck: (checkId: string) => void;
	onRunAllChecks: () => void;
	onRunCheck: (checkId: string) => void;
	overview: OverviewResponse | null;
}) {
	const [editingCheck, setEditingCheck] = useState<HttpCheck | null>(null);
	const servers = overview?.servers ?? [];
	const statusCounts = useMemo(() => {
		return checks.reduce(
			(counts, check) => {
				const status = check.lastResult?.status ?? "unknown";
				counts[status] += 1;
				return counts;
			},
			{ down: 0, healthy: 0, unknown: 0, warning: 0 },
		);
	}, [checks]);

	return (
		<section
			id="http-checks"
			className="mb-4.5 scroll-mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white"
		>
			<div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4.5 py-3.5 max-lg:flex-col max-lg:items-stretch">
				<div className="flex min-w-0 items-center gap-2.5">
					<div className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
						<Globe2 size={18} />
					</div>
					<div className="min-w-0">
						<h2 className="text-lg leading-tight font-extrabold text-slate-900">
							HTTP Checks
						</h2>
						<div className="mt-1 flex flex-wrap gap-1.5">
							<span className="inline-flex min-h-6 items-center rounded-full bg-slate-100 px-2.5 text-xs font-extrabold text-slate-700">
								{checks.length} checks
							</span>
							<span className="inline-flex min-h-6 items-center gap-1.5 rounded-full bg-green-100 px-2.5 text-xs font-extrabold text-green-800">
								<CheckCircle2 size={14} />
								{statusCounts.healthy} healthy
							</span>
							<span className="inline-flex min-h-6 items-center gap-1.5 rounded-full bg-red-100 px-2.5 text-xs font-extrabold text-red-800">
								<XCircle size={14} />
								{statusCounts.down + statusCounts.warning} issues
							</span>
						</div>
					</div>
				</div>
				<button
					type="button"
					className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-3.5 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
					disabled={isRunningAll || checks.length === 0}
					onClick={onRunAllChecks}
				>
					{isRunningAll ? (
						<LoaderCircle size={16} className="animate-spin" />
					) : (
						<Play size={16} />
					)}
					{isRunningAll ? "Checking" : "Run all"}
				</button>
			</div>

			{error && (
				<div className="border-b border-slate-200 px-4.5 py-3 text-sm font-bold text-rose-700">
					{error}
				</div>
			)}

			<HttpCheckForm
				editingCheck={editingCheck}
				isSaving={isSaving}
				onAddCheck={onAddCheck}
				onCancelEdit={() => setEditingCheck(null)}
				onEditCheck={onEditCheck}
				servers={servers}
			/>
			<HttpCheckTable
				activeCheckId={activeCheckId}
				checks={checks}
				isLoading={isLoading}
				now={now}
				onEditCheck={setEditingCheck}
				onRemoveCheck={onRemoveCheck}
				onRunCheck={onRunCheck}
				servers={servers}
			/>
		</section>
	);
}
