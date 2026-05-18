import { ArrowLeft, Box, Server, SquareTerminal, WifiOff } from "lucide-react";
import type {
	MonitorRuntimeSettings,
	MonitorRuntimeSettingsUpdateInput,
	ServerAlertPolicy,
	ServerAlertPolicyUpdateInput,
	StoredServer,
} from "@shared/types";
import { serverAppCounts } from "@/entities/application";
import {
	buildServerQuickActions,
	type QuickActionDefinition,
} from "@/features/quickActions";
import { ServerMonitorRuntimeDialog } from "@/features/monitorRuntime";
import { ServerAlertPolicyDialog } from "@/features/serverAlertPolicy";
import { ScanServerButton } from "@/features/serverScan";
import { relativeTime } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { ServerStatusBadge } from "@/shared/ui/ServerStatusBadge";
import { ServerQuickActions } from "./ServerQuickActions";

export function ServerDetailsHeader({
	alertPolicy,
	alertPolicyError,
	isAlertPolicyLoading,
	isMonitorRuntimeLoading,
	isScanDisabled,
	isSavingAlertPolicy,
	isSavingMonitorRuntime,
	isScanning,
	monitorRuntimeError,
	monitorRuntimeSettings,
	now,
	onBack,
	onRunQuickAction,
	onSaveAlertPolicy,
	onSaveMonitorRuntime,
	onScan,
	server,
}: {
	alertPolicy: ServerAlertPolicy | null;
	alertPolicyError: string;
	isAlertPolicyLoading: boolean;
	isMonitorRuntimeLoading: boolean;
	isScanDisabled: boolean;
	isSavingAlertPolicy: boolean;
	isSavingMonitorRuntime: boolean;
	isScanning: boolean;
	monitorRuntimeError: string;
	monitorRuntimeSettings: MonitorRuntimeSettings | null;
	now: number;
	onBack: () => void;
	onRunQuickAction: (action: QuickActionDefinition) => void;
	onSaveAlertPolicy: (input: ServerAlertPolicyUpdateInput) => Promise<boolean>;
	onSaveMonitorRuntime: (
		input: MonitorRuntimeSettingsUpdateInput,
	) => Promise<boolean>;
	onScan: () => void;
	server: StoredServer;
}) {
	const dockerApps = server.apps.filter((app) => app.kind === "docker").length;
	const pm2Apps = server.apps.filter((app) => app.kind === "pm2").length;
	const appCounts = serverAppCounts(server);
	const serverQuickActions = buildServerQuickActions(server);

	return (
		<div className="rounded-lg border border-slate-200 bg-white p-4.5">
			<Button className="mb-4" onClick={onBack} icon={ArrowLeft}>
				Back to dashboard
			</Button>

			<div className="flex items-start justify-between gap-4 max-md:flex-col">
				<div className="flex min-w-0 items-start gap-3">
					<span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
						{server.online ? <Server size={21} /> : <WifiOff size={21} />}
					</span>
					<div className="min-w-0">
						<div className="flex min-w-0 flex-wrap items-center gap-2">
							<h1 className="max-w-140 overflow-hidden text-ellipsis text-2xl leading-tight font-extrabold text-slate-900">
								{server.serverName}
							</h1>
							<ServerStatusBadge online={server.online} status={server.status} />
						</div>
						<p className="mt-1 max-w-140 overflow-hidden text-sm font-semibold text-ellipsis text-slate-500">
							{server.host.hostname}
						</p>
						<div className="mt-3 flex flex-wrap items-center gap-1.5">
							<Badge size="md">
								{appCounts.monitored}/{appCounts.total} monitored
							</Badge>
							{appCounts.ignored > 0 && (
								<Badge className="text-slate-500" size="md">
									{appCounts.ignored} ignored
								</Badge>
							)}
							<Badge icon={Box} size="md" tone="blue">
								{dockerApps} Docker
							</Badge>
							<Badge icon={SquareTerminal} size="md" tone="emerald">
								{pm2Apps} PM2
							</Badge>
							<Badge className="text-slate-500" size="md">
								Last scan {relativeTime(server.lastSeenAt, now)}
							</Badge>
						</div>
					</div>
				</div>

				<div className="flex shrink-0 gap-2 max-md:w-full max-md:flex-col [&>button]:min-h-10 [&>button]:px-3.5 max-md:[&>button]:w-full">
					<ServerAlertPolicyDialog
						error={alertPolicyError}
						isLoading={isAlertPolicyLoading}
						isSaving={isSavingAlertPolicy}
						onSavePolicy={onSaveAlertPolicy}
						policy={alertPolicy}
						server={server}
						trigger="button"
					/>
					<ServerMonitorRuntimeDialog
						error={monitorRuntimeError}
						isLoading={isMonitorRuntimeLoading}
						isSaving={isSavingMonitorRuntime}
						onSaveSettings={onSaveMonitorRuntime}
						server={server}
						settings={monitorRuntimeSettings}
						trigger="button"
					/>
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

			<ServerQuickActions
				actions={serverQuickActions}
				onRunQuickAction={onRunQuickAction}
			/>
		</div>
	);
}
