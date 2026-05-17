import {
	Activity,
	DatabaseZap,
	Globe2,
	KeyRound,
	LayoutDashboard,
	Server,
	Settings,
} from "lucide-react";
import type { OverviewResponse, StoredServer } from "@shared/types";
import {
	serverAppCounts,
	summaryMonitoredApps,
} from "@/entities/application";
import type { RealtimeStatus } from "@/shared/api/realtime";
import { Badge } from "@/shared/ui/Badge";
import { StatusBadge } from "@/shared/ui/StatusBadge";

type DashboardSection =
	| "dashboard"
	| "http-checks"
	| "settings"
	| "server-detail"
	| "ssh-targets";

const realtimeText: Record<RealtimeStatus, string> = {
	connecting: "Connecting",
	live: "Live",
	reconnecting: "Reconnecting",
	fallback: "Polling",
};

const realtimeClasses: Record<RealtimeStatus, string> = {
	connecting: "bg-blue-50 text-blue-700",
	live: "bg-green-100 text-green-800",
	reconnecting: "bg-blue-50 text-blue-700",
	fallback: "bg-amber-100 text-amber-800",
};

const navButtonClass = (isActive: boolean) => {
	return `inline-flex min-h-10 cursor-pointer items-center justify-between gap-2 rounded-lg px-3 text-sm font-extrabold max-lg:shrink-0 ${
		isActive
			? "bg-blue-50 text-blue-700"
			: "text-slate-700 hover:bg-slate-50"
	}`;
};

const navCountClass = (isActive: boolean) => {
	return `rounded-full px-2 py-0.5 text-xs ${
		isActive ? "bg-white text-blue-700" : "bg-slate-100 text-slate-500"
	}`;
};

export function DashboardSidebar({
	activeSection,
	httpCheckCount,
	onDashboardOpen,
	onHttpChecksOpen,
	onSettingsOpen,
	onSshTargetsOpen,
	overview,
	realtimeStatus,
	selectedServer,
	sshTargetCount,
}: {
	activeSection: DashboardSection;
	httpCheckCount: number;
	onDashboardOpen: () => void;
	onHttpChecksOpen: () => void;
	onSettingsOpen: () => void;
	onSshTargetsOpen: () => void;
	overview: OverviewResponse | null;
	realtimeStatus: RealtimeStatus;
	selectedServer: StoredServer | null;
	sshTargetCount: number;
}) {
	const summary = overview?.summary;
	const issueCount = (summary?.warningApps ?? 0) + (summary?.downApps ?? 0);
	const monitoredAppCount = summaryMonitoredApps(summary);
	const selectedServerAppCounts = selectedServer
		? serverAppCounts(selectedServer)
		: null;
	const navItems = [
		{
			count: summary?.totalServers ?? 0,
			icon: LayoutDashboard,
			label: "Dashboard",
			onClick: onDashboardOpen,
			section: "dashboard" as const,
		},
		{
			count: httpCheckCount,
			icon: Globe2,
			label: "HTTP Checks",
			onClick: onHttpChecksOpen,
			section: "http-checks" as const,
		},
		{
			count: sshTargetCount,
			icon: KeyRound,
			label: "SSH Targets",
			onClick: onSshTargetsOpen,
			section: "ssh-targets" as const,
		},
		{
			count: null,
			icon: Settings,
			label: "Settings",
			onClick: onSettingsOpen,
			section: "settings" as const,
		},
	];

	return (
		<aside className="sticky top-0 z-30 h-screen w-66 shrink-0 border-r border-slate-200 bg-white px-4 py-5 max-lg:h-auto max-lg:w-full max-lg:border-r-0 max-lg:border-b max-lg:py-3">
			<div className="flex h-full flex-col gap-5 max-lg:h-auto max-lg:gap-3">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<div className="flex items-center gap-2 text-sm font-extrabold text-blue-600">
							<Activity size={16} />
							VPS Monitor
						</div>
						<h1 className="mt-2 text-2xl leading-tight font-extrabold text-slate-900 max-lg:mt-0 max-lg:text-lg">
							Application Health
						</h1>
					</div>
					<span
						className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-[13px] font-extrabold ${realtimeClasses[realtimeStatus]}`}
					>
						<DatabaseZap size={14} />
						{realtimeText[realtimeStatus]}
					</span>
				</div>

				<div className="grid gap-1.5 max-lg:-mx-1 max-lg:flex max-lg:overflow-x-auto max-lg:px-1 max-lg:pb-1">
					<div className="mb-1 px-3 text-xs font-bold tracking-wide text-slate-400 uppercase max-lg:hidden">
						Navigation
					</div>
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive = activeSection === item.section;

						return (
							<button
								key={item.section}
								type="button"
								className={navButtonClass(isActive)}
								onClick={item.onClick}
								aria-current={isActive ? "page" : undefined}
							>
								<span className="inline-flex min-w-0 items-center gap-2">
									<Icon size={16} />
									<span className="truncate">{item.label}</span>
								</span>
								{item.count !== null && (
									<span className={navCountClass(isActive)}>
										{item.count}
									</span>
								)}
							</button>
						);
					})}
					{activeSection === "server-detail" && (
						<div className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg bg-blue-50 px-3 text-sm font-extrabold text-blue-700">
							<Server size={16} />
							Server detail
						</div>
					)}
				</div>

				{activeSection === "server-detail" && (
					<div className="rounded-lg border border-slate-200 bg-slate-50 p-3 max-lg:hidden">
						<span className="block text-xs font-bold tracking-wide text-slate-400 uppercase">
							Current server
						</span>
						{selectedServer ? (
							<div className="mt-2 grid gap-2">
								<strong className="block overflow-hidden text-ellipsis text-slate-900">
									{selectedServer.serverName}
								</strong>
								<span className="block overflow-hidden text-sm font-semibold text-ellipsis text-slate-500">
									{selectedServer.host.hostname}
								</span>
								<div className="flex flex-wrap gap-1.5">
									<StatusBadge status={selectedServer.status} />
									<Badge size="sm" tone="white">
										{selectedServerAppCounts?.monitored}/
										{selectedServerAppCounts?.total} apps
									</Badge>
								</div>
							</div>
						) : (
							<span className="mt-2 block text-sm font-semibold text-slate-500">
								Loading
							</span>
						)}
					</div>
				)}

				<div className="grid gap-2 border-t border-slate-200 pt-4 max-lg:hidden">
					<div className="rounded-lg bg-slate-50 px-3 py-2.5">
						<span className="block text-xs font-bold text-slate-500">
							Online servers
						</span>
						<strong className="mt-1 block text-lg font-extrabold text-slate-900">
							{summary?.onlineServers ?? 0}/{summary?.totalServers ?? 0}
						</strong>
					</div>
					<div className="rounded-lg bg-slate-50 px-3 py-2.5">
						<span className="block text-xs font-bold text-slate-500">
							Apps
						</span>
						<strong className="mt-1 block text-lg font-extrabold text-slate-900">
							{monitoredAppCount}/{summary?.totalApps ?? 0}
						</strong>
					</div>
					<div className="rounded-lg bg-slate-50 px-3 py-2.5">
						<span className="block text-xs font-bold text-slate-500">
							Issues
						</span>
						<strong className="mt-1 block text-lg font-extrabold text-slate-900">
							{issueCount}
						</strong>
					</div>
				</div>
			</div>
		</aside>
	);
}
