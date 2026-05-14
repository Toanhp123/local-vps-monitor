import {
	Activity,
	AlertTriangle,
	Box,
	CircleX,
	DatabaseZap,
	Server,
	SquareTerminal,
	WifiOff,
} from "lucide-react";
import type { OverviewResponse } from "../../../../shared/types";
import type { ServerViewFilter } from "../../../entities/server/model/serverViewFilter";
import type { RealtimeStatus } from "../../../shared/api/realtime";

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

export function DashboardSidebar({
	activeFilter,
	onFilterChange,
	overview,
	realtimeStatus,
}: {
	activeFilter: ServerViewFilter;
	onFilterChange: (filter: ServerViewFilter) => void;
	overview: OverviewResponse | null;
	realtimeStatus: RealtimeStatus;
}) {
	const summary = overview?.summary;
	const servers = overview?.servers ?? [];
	const issueCount = (summary?.warningApps ?? 0) + (summary?.downApps ?? 0);
	const offlineServers = servers.filter((server) => !server.online).length;
	const warningServers = servers.filter((server) =>
		server.apps.some((app) => app.health === "warning"),
	).length;
	const downServers = servers.filter((server) =>
		server.apps.some((app) => app.health === "down"),
	).length;
	const dockerServers = servers.filter((server) =>
		server.apps.some((app) => app.kind === "docker"),
	).length;
	const pm2Servers = servers.filter((server) =>
		server.apps.some((app) => app.kind === "pm2"),
	).length;
	const needsAttentionServers = servers.filter((server) => {
		return (
			!server.online ||
			server.apps.some(
				(app) => app.health === "warning" || app.health === "down",
			)
		);
	}).length;
	const filterItems: Array<{
		count: number;
		filter: ServerViewFilter;
		icon: typeof Server;
		label: string;
		tone?: string;
	}> = [
		{ filter: "all", icon: Server, label: "All servers", count: servers.length },
		{
			filter: "needs-attention",
			icon: AlertTriangle,
			label: "Needs attention",
			count: needsAttentionServers,
			tone: "warn",
		},
		{
			filter: "offline",
			icon: WifiOff,
			label: "Offline servers",
			count: offlineServers,
			tone: "bad",
		},
		{
			filter: "warnings",
			icon: AlertTriangle,
			label: "Warning apps",
			count: warningServers,
			tone: "warn",
		},
		{
			filter: "down",
			icon: CircleX,
			label: "Down apps",
			count: downServers,
			tone: "bad",
		},
		{
			filter: "docker",
			icon: Box,
			label: "Docker",
			count: dockerServers,
		},
		{
			filter: "pm2",
			icon: SquareTerminal,
			label: "PM2",
			count: pm2Servers,
		},
	];

	return (
		<aside className="sticky top-0 h-screen w-66 shrink-0 border-r border-slate-200 bg-white px-4 py-5 max-lg:static max-lg:h-auto max-lg:w-full max-lg:border-r-0 max-lg:border-b">
			<div className="flex h-full flex-col gap-5 max-lg:h-auto">
				<div>
					<div className="flex items-center gap-2 text-sm font-extrabold text-blue-600">
						<Activity size={16} />
						VPS Monitor
					</div>
					<h1 className="mt-2 text-2xl leading-tight font-extrabold text-slate-900">
						Application Health
					</h1>
				</div>

				<div className="grid gap-1.5">
					<div className="mb-1 px-3 text-xs font-bold tracking-wide text-slate-400 uppercase">
						View
					</div>
					{filterItems.map((item) => {
						const Icon = item.icon;
						const isActive = activeFilter === item.filter;
						const toneClass =
							item.tone === "bad"
								? "text-rose-700"
								: item.tone === "warn"
									? "text-amber-700"
									: "text-slate-700";

						return (
							<button
								key={item.filter}
								type="button"
								className={`inline-flex min-h-10 cursor-pointer items-center justify-between gap-2 rounded-lg px-3 text-sm font-extrabold ${
									isActive
										? "bg-blue-50 text-blue-700"
										: "text-slate-700 hover:bg-slate-50"
								}`}
								onClick={() => onFilterChange(item.filter)}
							>
								<span className="inline-flex min-w-0 items-center gap-2">
									<Icon size={16} className={isActive ? "" : toneClass} />
									<span className="truncate">{item.label}</span>
								</span>
								<span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">
									{item.count}
								</span>
							</button>
						);
					})}
				</div>

				<div className="grid gap-2 border-t border-slate-200 pt-4 max-lg:grid-cols-3 max-sm:grid-cols-1">
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
							{summary?.totalApps ?? 0}
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

				<div className="mt-auto max-lg:mt-0">
					<span
						className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-[13px] font-extrabold ${realtimeClasses[realtimeStatus]}`}
					>
						<DatabaseZap size={14} />
						{realtimeText[realtimeStatus]}
					</span>
				</div>
			</div>
		</aside>
	);
}
