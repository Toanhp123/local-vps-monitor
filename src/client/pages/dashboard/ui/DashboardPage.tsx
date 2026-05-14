import { AlertTriangle } from "lucide-react";
import { useDashboardOverview } from "../model/useDashboardOverview";
import { useSshTargetManager } from "../model/useSshTargetManager";
import { DashboardHeader } from "../../../widgets/dashboardHeader/ui/DashboardHeader";
import { DashboardSidebar } from "../../../widgets/dashboardSidebar/ui/DashboardSidebar";
import { ServerList } from "../../../widgets/serverList/ui/ServerList";
import { SshTargetManagerPanel } from "../../../widgets/sshTargets/ui/SshTargetManagerPanel";
import { SummaryStats } from "../../../widgets/summaryStats/ui/SummaryStats";
import { useNow } from "../../../shared/lib/useNow";
import { Toast } from "../../../shared/ui/Toast";

export function DashboardPage() {
	const now = useNow();
	const {
		filteredServers,
		loadOverview,
		overview,
		query,
		realtimeStatus,
		requestStatus,
		setQuery,
		setViewFilter,
		viewFilter,
	} = useDashboardOverview();
	const sshTargetManager = useSshTargetManager(loadOverview);

	return (
		<div className="flex min-h-screen bg-[#eef1f5] text-slate-900 antialiased max-lg:flex-col">
			<DashboardSidebar
				activeFilter={viewFilter}
				onFilterChange={setViewFilter}
				overview={overview}
				realtimeStatus={realtimeStatus}
			/>

			<main className="min-w-0 flex-1">
				<div className="mx-auto max-w-360 p-7 max-md:p-4.5">
					<DashboardHeader
						isScanAllDisabled={
							sshTargetManager.targets.length === 0 ||
							Boolean(sshTargetManager.activeScanId)
						}
						isScanningAll={
							sshTargetManager.activeScanId === sshTargetManager.scanAllId
						}
						onScanAll={sshTargetManager.scanAllTargets}
						query={query}
						onQueryChange={setQuery}
					/>

					{requestStatus === "error" && (
						<div className="mb-4 flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 font-bold text-rose-800">
							<AlertTriangle size={18} />
							API is not reachable
						</div>
					)}

					<SummaryStats overview={overview} />
					<SshTargetManagerPanel
						activeScanId={sshTargetManager.activeScanId}
						error={sshTargetManager.error}
						isLoading={sshTargetManager.isLoading}
						isSaving={sshTargetManager.isSaving}
						onAddTarget={sshTargetManager.addTarget}
						onRemoveTarget={sshTargetManager.removeTarget}
						onScanTarget={sshTargetManager.scanTarget}
						targets={sshTargetManager.targets}
					/>
					<ServerList
						activeScanId={sshTargetManager.activeScanId}
						hasActiveFilter={viewFilter !== "all"}
						now={now}
						onScanServer={sshTargetManager.scanTarget}
						query={query}
						servers={filteredServers}
					/>
				</div>
			</main>
			<Toast toast={sshTargetManager.toast} />
		</div>
	);
}
