import { useMemo, useState } from "react";
import { CheckCircle2, Globe2, Play, XCircle } from "lucide-react";
import type {
	HttpCheck,
	HttpCheckCreateInput,
	HttpCheckUpdateInput,
	OverviewResponse,
} from "@shared/types";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Panel, PanelError, PanelHeader } from "@/shared/ui/Panel";
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
		<Panel
			id="http-checks"
			className="mb-4.5 scroll-mt-6"
		>
			<PanelHeader
				badges={
					<>
						<Badge>{checks.length} checks</Badge>
						<Badge icon={CheckCircle2} tone="green">
							{statusCounts.healthy} healthy
						</Badge>
						<Badge icon={XCircle} tone="red">
							{statusCounts.down + statusCounts.warning} issues
						</Badge>
					</>
				}
				icon={Globe2}
				iconClassName="bg-cyan-50 text-cyan-700"
				title="HTTP Checks"
				actions={
					<Button
						disabled={isRunningAll || checks.length === 0}
						onClick={onRunAllChecks}
						icon={Play}
						isLoading={isRunningAll}
						size="lg"
						variant="accent"
					>
						{isRunningAll ? "Checking" : "Run all"}
					</Button>
				}
			/>

			{error && <PanelError>{error}</PanelError>}

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
		</Panel>
	);
}
