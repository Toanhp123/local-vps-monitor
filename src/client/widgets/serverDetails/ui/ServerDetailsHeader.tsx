import { ArrowLeft, Box, Server, SquareTerminal, WifiOff } from "lucide-react";
import type { StoredServer } from "@shared/types";
import { serverAppCounts } from "@/entities/application";
import {
	buildServerQuickActions,
	type QuickActionDefinition,
} from "@/features/quickActions";
import { ScanServerButton } from "@/features/serverScan";
import { relativeTime } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { ServerQuickActions } from "./ServerQuickActions";

export function ServerDetailsHeader({
	isScanDisabled,
	isScanning,
	now,
	onBack,
	onRunQuickAction,
	onScan,
	server,
}: {
	isScanDisabled: boolean;
	isScanning: boolean;
	now: number;
	onBack: () => void;
	onRunQuickAction: (action: QuickActionDefinition) => void;
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
							<StatusBadge status={server.status} />
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

			<ServerQuickActions
				actions={serverQuickActions}
				onRunQuickAction={onRunQuickAction}
			/>
		</div>
	);
}
