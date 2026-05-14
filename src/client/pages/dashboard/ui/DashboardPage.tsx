import { AlertTriangle } from "lucide-react";
import { useDashboardOverview } from "../model/useDashboardOverview";
import { useSshTargetManager } from "../model/useSshTargetManager";
import { DashboardHeader } from "../../../widgets/dashboardHeader/ui/DashboardHeader";
import { ServerList } from "../../../widgets/serverList/ui/ServerList";
import { SshTargetManagerPanel } from "../../../widgets/sshTargets/ui/SshTargetManagerPanel";
import { SummaryStats } from "../../../widgets/summaryStats/ui/SummaryStats";
import { useNow } from "../../../shared/lib/useNow";

export function DashboardPage() {
	const now = useNow();
	const {
		filteredServers,
		lastDataUpdate,
		loadOverview,
		overview,
		query,
		realtimeStatus,
		requestStatus,
		setQuery,
	} = useDashboardOverview();
	const sshTargetManager = useSshTargetManager(loadOverview);

	return (
		<main className="min-h-screen bg-[#eef1f5] text-slate-900 antialiased">
			<div className="mx-auto max-w-360 p-7 max-md:p-4.5">
				<DashboardHeader
					query={query}
					realtimeStatus={realtimeStatus}
					onQueryChange={setQuery}
					onRefresh={loadOverview}
				/>

				{requestStatus === "error" && (
					<div className="mb-4 flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 font-bold text-rose-800">
						<AlertTriangle size={18} />
						API is not reachable
					</div>
				)}

				<SummaryStats
					now={now}
					overview={overview}
					lastDataUpdate={lastDataUpdate}
				/>
				<SshTargetManagerPanel
					activeScanId={sshTargetManager.activeScanId}
					error={sshTargetManager.error}
					isLoading={sshTargetManager.isLoading}
					isSaving={sshTargetManager.isSaving}
					lastScanMessage={sshTargetManager.lastScanMessage}
					onAddTarget={sshTargetManager.addTarget}
					onRemoveTarget={sshTargetManager.removeTarget}
					onScanAllTargets={sshTargetManager.scanAllTargets}
					onScanTarget={sshTargetManager.scanTarget}
					scanAllId={sshTargetManager.scanAllId}
					targets={sshTargetManager.targets}
				/>
				<ServerList now={now} servers={filteredServers} />
			</div>
		</main>
	);
}
