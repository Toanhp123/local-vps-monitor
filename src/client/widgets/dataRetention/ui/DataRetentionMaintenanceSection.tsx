import { RefreshCw, Wrench } from "lucide-react";
import type { DataRetentionMaintenanceAction } from "@/features/dataRetention";
import { Button } from "@/shared/ui/Button";
import { dataRetentionMaintenanceConfig } from "../model/dataRetentionPanelModel";

export function DataRetentionMaintenanceSection({
	activeMaintenanceAction,
	isBusy,
	isStatsLoading,
	onPendingActionChange,
	onRefreshStats,
	onRunMaintenance,
	pendingMaintenanceAction,
}: {
	activeMaintenanceAction: DataRetentionMaintenanceAction | null;
	isBusy: boolean;
	isStatsLoading: boolean;
	onPendingActionChange: (
		action: DataRetentionMaintenanceAction | null,
	) => void;
	onRefreshStats: () => void;
	onRunMaintenance: (action: DataRetentionMaintenanceAction) => void;
	pendingMaintenanceAction: DataRetentionMaintenanceAction | null;
}) {
	const pendingMaintenance = pendingMaintenanceAction
		? dataRetentionMaintenanceConfig[pendingMaintenanceAction]
		: null;

	return (
		<div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
			<div className="mb-3 flex items-center justify-between gap-3 max-md:flex-col max-md:items-start">
				<div>
					<div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
						<Wrench size={15} />
						Maintenance
					</div>
					<p className="mt-1 text-xs font-semibold text-slate-500">
						Manual database operations for cleanup and file compaction.
					</p>
				</div>
				<Button
					disabled={isBusy}
					icon={RefreshCw}
					isLoading={isStatsLoading}
					onClick={onRefreshStats}
					size="sm"
				>
					Refresh stats
				</Button>
			</div>

			<div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
				{(
					Object.entries(dataRetentionMaintenanceConfig) as Array<
						[
							DataRetentionMaintenanceAction,
							(typeof dataRetentionMaintenanceConfig)[DataRetentionMaintenanceAction],
						]
					>
				).map(([action, config]) => {
					const Icon = config.icon;

					return (
						<button
							key={action}
							type="button"
							disabled={isBusy}
							onClick={() => onPendingActionChange(action)}
							className="flex min-h-18 cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
						>
							<span className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
								<Icon size={16} />
							</span>
							<span className="min-w-0">
								<span className="block text-sm font-extrabold text-slate-900">
									{config.buttonLabel}
								</span>
								<span className="mt-0.5 block text-xs leading-5 font-semibold text-slate-500">
									{config.description}
								</span>
							</span>
						</button>
					);
				})}
			</div>

			{pendingMaintenance && pendingMaintenanceAction && (
				<div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
					<div className="text-sm font-extrabold text-rose-800">
						Confirm {pendingMaintenance.buttonLabel.toLowerCase()}
					</div>
					<p className="mt-1 text-xs leading-5 font-semibold text-rose-700">
						{pendingMaintenance.message}
					</p>
					<div className="mt-3 flex justify-end gap-2 max-md:flex-col">
						<Button
							disabled={isBusy}
							onClick={() => onPendingActionChange(null)}
							size="sm"
						>
							Cancel
						</Button>
						<Button
							disabled={isBusy}
							icon={pendingMaintenance.icon}
							isLoading={
								activeMaintenanceAction === pendingMaintenanceAction
							}
							onClick={() => onRunMaintenance(pendingMaintenanceAction)}
							size="sm"
							variant="danger"
						>
							{pendingMaintenance.confirmLabel}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
