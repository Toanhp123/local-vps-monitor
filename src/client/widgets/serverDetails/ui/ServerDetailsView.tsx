import { ArrowLeft, Box, Server, SquareTerminal, WifiOff } from "lucide-react";
import type {
	AppMonitorAppOverrideInput,
	AppSnapshot,
	StoredServer,
} from "../../../../shared/types";
import {
	appGroupSourceLabels,
	groupApplications,
} from "../../../entities/application/model/groupApplications";
import {
	monitoredApps,
	serverAppCounts,
} from "../../../entities/application/model/appMonitoringPolicy";
import { ApplicationTable } from "../../../entities/application/ui/ApplicationTable";
import { ServerMetricCharts } from "../../../entities/server/ui/ServerMetricCharts";
import { ServerMetricsGrid } from "../../../entities/server/ui/ServerMetricsGrid";
import { AppPolicyDialog } from "../../../features/appMonitoringRules/ui/AppPolicyDialog";
import { OpenAppLogsButton } from "../../../features/appLogs/ui/OpenAppLogsButton";
import type { usePinnedItems } from "../../../features/pinnedItems/model/usePinnedItems";
import { PinToggleButton } from "../../../features/pinnedItems/ui/PinToggleButton";
import {
	buildAppQuickActions,
	buildServerQuickActions,
	type QuickActionDefinition,
} from "../../../features/quickActions/model/quickActions";
import { QuickActionButton } from "../../../features/quickActions/ui/QuickActionButton";
import { QuickActionMenu } from "../../../features/quickActions/ui/QuickActionMenu";
import { ScanServerButton } from "../../../features/serverScan/ui/ScanServerButton";
import { relativeTime } from "../../../shared/lib/format";
import { StatusBadge } from "../../../shared/ui/StatusBadge";

export function ServerDetailsView({
	activeAppPolicyKey,
	isScanDisabled,
	isSavingAppPolicy,
	isScanning,
	now,
	onBack,
	onOpenAppLogs,
	onRunQuickAction,
	onUpdateAppPolicy,
	onScan,
	pinnedItems,
	server,
}: {
	activeAppPolicyKey: string | null;
	isScanDisabled: boolean;
	isSavingAppPolicy: boolean;
	isScanning: boolean;
	now: number;
	onBack: () => void;
	onOpenAppLogs: (app: AppSnapshot) => void;
	onRunQuickAction: (action: QuickActionDefinition) => void;
	onUpdateAppPolicy: (input: AppMonitorAppOverrideInput) => Promise<boolean>;
	onScan: () => void;
	pinnedItems: ReturnType<typeof usePinnedItems>;
	server: StoredServer;
}) {
	const dockerApps = server.apps.filter(
		(app) => app.kind === "docker",
	).length;
	const pm2Apps = server.apps.filter((app) => app.kind === "pm2").length;
	const appGroups = pinnedItems.sortAppGroups(
		server.serverId,
		groupApplications(server.apps),
	);
	const serverQuickActions = buildServerQuickActions(server);
	const appCounts = serverAppCounts(server);

	return (
		<section className="grid gap-4">
			<div className="rounded-lg border border-slate-200 bg-white p-4.5">
				<button
					type="button"
					className="mb-4 inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
					onClick={onBack}
				>
					<ArrowLeft size={16} />
					Back to dashboard
				</button>

				<div className="flex items-start justify-between gap-4 max-md:flex-col">
					<div className="flex min-w-0 items-start gap-3">
						<span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
							{server.online ? (
								<Server size={21} />
							) : (
								<WifiOff size={21} />
							)}
						</span>
						<div className="min-w-0">
							<div className="flex min-w-0 flex-wrap items-center gap-2">
								<h1 className="max-w-140 overflow-hidden text-ellipsis text-2xl leading-tight font-extrabold text-slate-900">
									{server.serverName}
								</h1>
								<StatusBadge status={server.status} />
							</div>
							<p className="mt-1 max-w-140 overflow-hidden text-sm font-semibold text-ellipsis text-slate-500">
								{server.host.hostname}
							</p>
							<div className="mt-3 flex flex-wrap items-center gap-1.5">
								<span className="inline-flex min-h-7 items-center rounded-full bg-slate-100 px-2.5 text-xs font-extrabold text-slate-700">
									{appCounts.monitored}/{appCounts.total} monitored
								</span>
								{appCounts.ignored > 0 && (
									<span className="inline-flex min-h-7 items-center rounded-full bg-slate-100 px-2.5 text-xs font-extrabold text-slate-500">
										{appCounts.ignored} ignored
									</span>
								)}
								<span className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-blue-50 px-2.5 text-xs font-extrabold text-blue-700">
									<Box size={13} />
									{dockerApps} Docker
								</span>
								<span className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 text-xs font-extrabold text-emerald-700">
									<SquareTerminal size={13} />
									{pm2Apps} PM2
								</span>
								<span className="inline-flex min-h-7 items-center rounded-full bg-slate-100 px-2.5 text-xs font-extrabold text-slate-500">
									Last scan{" "}
									{relativeTime(server.lastSeenAt, now)}
								</span>
							</div>
						</div>
					</div>

					<div className="max-md:w-full [&>button]:min-h-10 [&>button]:w-full [&>button]:px-3.5">
						<ScanServerButton
							ariaLabel={`Scan ${server.serverName}`}
							isDisabled={isScanDisabled}
							isScanning={isScanning}
							label="Scan server"
							onScan={onScan}
							variant="primary"
						/>
					</div>
				</div>

				{serverQuickActions.length > 0 && (
					<div className="mt-4 border-t border-slate-200 pt-4">
						<div className="mb-2 text-xs font-bold text-slate-500 uppercase">
							Quick actions
						</div>
						<div className="flex flex-wrap gap-2">
							{serverQuickActions.map((action) => (
								<QuickActionButton
									key={action.actionId}
									action={action}
									onRun={onRunQuickAction}
								/>
							))}
						</div>
					</div>
				)}
			</div>

			<div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
				<ServerMetricsGrid server={server} />
				<ServerMetricCharts server={server} />

				<div className="border-t border-slate-200">
					<div className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-2.5">
						<span className="text-xs font-bold text-slate-500 uppercase">
							Application groups on {server.serverName}
						</span>
					</div>
					{appGroups.length > 0 ? (
						<div className="grid gap-3 bg-slate-50 p-3">
							{appGroups.map((group) => {
								const GroupIcon =
									group.source === "pm2"
										? SquareTerminal
										: Box;

								return (
									<div
										key={group.id}
										className="overflow-hidden rounded-lg border border-slate-200 bg-white"
									>
										<div className="flex items-center justify-between gap-3 border-b border-slate-200 px-3.5 py-3 max-md:flex-col max-md:items-stretch">
											<div className="flex min-w-0 items-center gap-2.5">
												<PinToggleButton
													ariaLabel={
														pinnedItems.isAppGroupPinned(
															server.serverId,
															group.id,
														)
															? `Unpin ${group.name}`
															: `Pin ${group.name}`
													}
													isPinned={pinnedItems.isAppGroupPinned(
														server.serverId,
														group.id,
													)}
													onToggle={() =>
														pinnedItems.toggleAppGroupPin(
															server.serverId,
															group.id,
														)
													}
												/>
												<span className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
													<GroupIcon size={17} />
												</span>
												<div className="min-w-0">
													<strong className="block max-w-100 overflow-hidden text-ellipsis text-slate-900">
														{group.name}
													</strong>
													<span className="mt-0.5 block text-xs font-bold text-slate-500 uppercase">
														{
															appGroupSourceLabels[
																group.source
															]
														}
													</span>
												</div>
											</div>

											<div className="flex flex-wrap items-center gap-1.5">
												<StatusBadge
													status={group.status}
												/>
												<span className="inline-flex min-h-7 items-center rounded-full bg-slate-100 px-2.5 text-xs font-extrabold text-slate-700">
													{monitoredApps(group.apps).length}/
													{group.apps.length} apps
												</span>
												{group.dockerCount > 0 && (
													<span className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-blue-50 px-2.5 text-xs font-extrabold text-blue-700">
														<Box size={13} />
														{group.dockerCount}
													</span>
												)}
												{group.pm2Count > 0 && (
													<span className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 text-xs font-extrabold text-emerald-700">
														<SquareTerminal
															size={13}
														/>
														{group.pm2Count}
													</span>
												)}
											</div>
										</div>

										<ApplicationTable
											actions={(app) => {
												const appQuickActions =
													buildAppQuickActions(
														server,
														app,
													);

												return (
													<div className="flex justify-end gap-1.5">
														<AppPolicyDialog
															app={app}
															isSaving={
																isSavingAppPolicy &&
																activeAppPolicyKey ===
																	`${server.serverId}:${app.id}`
															}
															onSave={onUpdateAppPolicy}
															serverId={server.serverId}
														/>
														<OpenAppLogsButton
															onOpen={() =>
																onOpenAppLogs(
																	app,
																)
															}
														/>
														<QuickActionMenu
															actions={
																appQuickActions
															}
															onRun={
																onRunQuickAction
															}
														/>
													</div>
												);
											}}
											apps={group.apps}
										/>
									</div>
								);
							})}
						</div>
					) : (
						<ApplicationTable apps={[]} />
					)}
				</div>
			</div>
		</section>
	);
}
