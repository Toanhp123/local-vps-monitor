import { useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import type {
	SshTarget,
	SshTargetBootstrapInput,
	SshTargetBulkImportInput,
	SshTargetCreateInput,
	SshTargetUpdateInput,
} from "@shared/types";
import { Badge } from "@/shared/ui/Badge";
import { Panel, PanelError, PanelHeader } from "@/shared/ui/Panel";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { SshTargetBulkImport } from "./SshTargetBulkImport";
import { SshTargetForm } from "./SshTargetForm";
import { SshTargetTable } from "./SshTargetTable";

type SshTargetEntryMode = "single" | "bulk";
const entryModeOptions: Array<{ label: string; value: SshTargetEntryMode }> = [
	{ label: "Add one", value: "single" },
	{ label: "Bulk import", value: "bulk" },
];

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
	const [entryMode, setEntryMode] = useState<SshTargetEntryMode>("single");

	return (
		<Panel
			id="ssh-targets"
			className="mb-4.5 scroll-mt-6"
		>
			<PanelHeader
				badges={
					<>
						<Badge>{targets.length} targets</Badge>
						<Badge icon={ShieldCheck} tone="green">
							Local only
						</Badge>
						<Badge icon={KeyRound}>Key auth</Badge>
					</>
				}
				icon={KeyRound}
				title="Local SSH Targets"
			/>

			{error && (
				<PanelError className="flex min-w-0 flex-wrap gap-2">
					<span className="min-w-0 wrap-break-word text-rose-700">
						{error}
					</span>
				</PanelError>
			)}

			<div className="border-b border-slate-200 bg-slate-50 px-4.5 py-3">
				<SegmentedControl
					ariaLabel="SSH target entry mode"
					onChange={setEntryMode}
					options={entryModeOptions}
					value={entryMode}
				/>
			</div>

			{entryMode === "single" ? (
				<SshTargetForm
					isSaving={isSaving}
					onAddTarget={onAddTarget}
					onBootstrapTarget={onBootstrapTarget}
				/>
			) : (
				<SshTargetBulkImport
					isSaving={isSaving}
					onBulkImportTargets={onBulkImportTargets}
				/>
			)}

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
		</Panel>
	);
}
