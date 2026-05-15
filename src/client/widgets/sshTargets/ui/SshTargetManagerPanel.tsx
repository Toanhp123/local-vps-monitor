import { useState } from "react";
import { ChevronDown, ChevronUp, KeyRound, ShieldCheck } from "lucide-react";
import type {
	SshTarget,
	SshTargetBootstrapInput,
	SshTargetBulkImportInput,
	SshTargetCreateInput,
	SshTargetUpdateInput,
} from "../../../../shared/types";
import { SshTargetBulkImport } from "./SshTargetBulkImport";
import { SshTargetForm } from "./SshTargetForm";
import { SshTargetTable } from "./SshTargetTable";

export function SshTargetManagerPanel({
	activeScanId,
	activeTestId,
	error,
	isLoading,
	isScanDisabled,
	isSaving,
	onAddTarget,
	onBootstrapTarget,
	onBulkImportTargets,
	onEditTarget,
	onRemoveTarget,
	onScanTarget,
	onTestTarget,
	targets,
}: {
	activeScanId: string | null;
	activeTestId: string | null;
	error: string;
	isLoading: boolean;
	isScanDisabled: boolean;
	isSaving: boolean;
	onAddTarget: (input: SshTargetCreateInput) => Promise<boolean>;
	onBootstrapTarget: (input: SshTargetBootstrapInput) => Promise<boolean>;
	onBulkImportTargets: (input: SshTargetBulkImportInput) => Promise<boolean>;
	onEditTarget: (targetId: string, input: SshTargetUpdateInput) => Promise<boolean>;
	onRemoveTarget: (targetId: string) => void;
	onScanTarget: (targetId: string) => void;
	onTestTarget: (targetId: string) => void;
	targets: SshTarget[];
}) {
	const [isManagingTargets, setIsManagingTargets] = useState(false);
	const showManagement =
		(!isLoading && targets.length === 0) || isManagingTargets;

	return (
		<section
			id="ssh-targets"
			className="mb-4.5 scroll-mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white"
		>
			<div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4.5 py-3.5 max-lg:flex-col max-lg:items-stretch">
				<div className="flex min-w-0 items-center gap-2.5">
					<div className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
						<KeyRound size={18} />
					</div>
					<div className="min-w-0">
						<h2 className="text-lg leading-tight font-extrabold text-slate-900">
							Local SSH Targets
						</h2>
						<div className="mt-1 flex flex-wrap gap-1.5">
							<span className="inline-flex min-h-6 items-center rounded-full bg-slate-100 px-2.5 text-xs font-extrabold text-slate-700">
								{targets.length} targets
							</span>
							<span className="inline-flex min-h-6 items-center gap-1.5 rounded-full bg-green-100 px-2.5 text-xs font-extrabold text-green-800">
								<ShieldCheck size={14} />
								Local only
							</span>
							<span className="inline-flex min-h-6 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-xs font-extrabold text-slate-700">
								<KeyRound size={14} />
								Key auth
							</span>
						</div>
					</div>
				</div>
				<div className="flex flex-wrap items-center justify-end gap-2.5 max-lg:justify-start">
					{targets.length > 0 && (
						<button
							type="button"
							className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
							onClick={() =>
								setIsManagingTargets((current) => !current)
							}
							aria-expanded={showManagement}
						>
							{showManagement ? (
								<ChevronUp size={16} />
							) : (
								<ChevronDown size={16} />
							)}
							Manage
						</button>
					)}
				</div>
			</div>

			{error && showManagement && (
				<div className="flex min-w-0 flex-wrap gap-2 border-b border-slate-200 px-4.5 py-3 text-sm font-bold">
					<span className="min-w-0 wrap-break-word text-rose-700">
						{error}
					</span>
				</div>
			)}

			{showManagement && (
				<>
					<SshTargetForm
						isSaving={isSaving}
						onAddTarget={onAddTarget}
						onBootstrapTarget={onBootstrapTarget}
					/>
					<SshTargetBulkImport
						isSaving={isSaving}
						onBulkImportTargets={onBulkImportTargets}
					/>
					<SshTargetTable
						activeScanId={activeScanId}
						activeTestId={activeTestId}
						isLoading={isLoading}
						isScanDisabled={isScanDisabled}
						isSaving={isSaving}
						onEditTarget={onEditTarget}
						onRemoveTarget={onRemoveTarget}
						onScanTarget={onScanTarget}
						onTestTarget={onTestTarget}
						targets={targets}
					/>
				</>
			)}
		</section>
	);
}
