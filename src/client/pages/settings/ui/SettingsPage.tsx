import {
	BellRing,
	MonitorCog,
	ServerCog,
	Settings2,
} from "lucide-react";
import { useMonitorShellContext } from "@/widgets/monitorShell";
import { MonitorRuntimePanel } from "@/widgets/monitorRuntime";
import { ServerAlertDefaultsPanel } from "@/widgets/serverAlertPolicy";
import { Badge } from "@/shared/ui/Badge";

export function SettingsPage() {
	const { monitorRuntime, serverAlertPolicy } = useMonitorShellContext();
	const alertOverrideCount = serverAlertPolicy.policy
		? Object.keys(serverAlertPolicy.policy.serverOverrides).length
		: null;
	const runtimeOverrideCount = monitorRuntime.settings
		? Object.keys(monitorRuntime.settings.serverOverrides).length
		: null;
	const overrideSummaryValue =
		alertOverrideCount === null && runtimeOverrideCount === null
			? "--"
			: String(
					new Set([
						...Object.keys(
							serverAlertPolicy.policy?.serverOverrides ?? {},
						),
						...Object.keys(
							monitorRuntime.settings?.serverOverrides ?? {},
						),
					]).size,
				);

	return (
		<section className="mx-auto grid max-w-250 gap-5">
			<div className="flex items-start justify-between gap-4 max-lg:flex-col">
				<div className="min-w-0">
					<div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-blue-700">
						<Settings2 size={16} />
						Settings
					</div>
					<h1 className="text-[34px] leading-tight font-extrabold text-slate-900 max-md:text-[28px]">
						System Settings
					</h1>
					<p className="mt-1 max-w-190 text-sm leading-6 font-semibold text-slate-500">
						Default monitor and alert settings used when a server has no
						override.
					</p>
				</div>
			</div>

			<div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
				<div className="flex items-start justify-between gap-4 px-5 py-4.5 max-lg:flex-col">
					<div className="flex min-w-0 items-start gap-3">
						<span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
							<ServerCog size={22} />
						</span>
						<div className="min-w-0">
							<h2 className="text-xl leading-tight font-extrabold text-slate-900">
								Default Mode
							</h2>
							<p className="mt-1 max-w-150 text-sm leading-6 font-semibold text-slate-500">
								Every server follows these defaults until a server-level
								alert or runtime override is set.
							</p>
						</div>
					</div>
					<div className="flex shrink-0 flex-wrap gap-2">
						<Badge icon={BellRing} size="lg" tone="amber">
							{alertOverrideCount ?? "--"} alert overrides
						</Badge>
						<Badge icon={MonitorCog} size="lg" tone="blue">
							{runtimeOverrideCount ?? "--"} runtime overrides
						</Badge>
						<Badge icon={ServerCog} size="lg" tone="green">
							{overrideSummaryValue} servers custom
						</Badge>
					</div>
				</div>
				<div className="grid grid-cols-3 border-t border-slate-200 max-md:grid-cols-1">
					<div className="border-r border-slate-200 px-5 py-4 max-md:border-r-0 max-md:border-b">
						<div className="text-xs font-bold text-slate-500 uppercase">
							Alert Defaults
						</div>
						<div className="mt-1 text-lg font-extrabold text-slate-900">
							{serverAlertPolicy.policy ? "3 groups" : "--"}
						</div>
						<div className="mt-1 text-xs font-semibold text-slate-500">
							Disk, memory, and CPU limits
						</div>
					</div>
					<div className="border-r border-slate-200 px-5 py-4 max-md:border-r-0 max-md:border-b">
						<div className="text-xs font-bold text-slate-500 uppercase">
							Runtime Defaults
						</div>
						<div className="mt-1 text-lg font-extrabold text-slate-900">
							{monitorRuntime.settings ? "9 values" : "--"}
						</div>
						<div className="mt-1 text-xs font-semibold text-slate-500">
							Scan, timeout, concurrency, retention
						</div>
					</div>
					<div className="px-5 py-4">
						<div className="text-xs font-bold text-slate-500 uppercase">
							Overrides
						</div>
						<div className="mt-1 text-lg font-extrabold text-slate-900">
							{overrideSummaryValue}
						</div>
						<div className="mt-1 text-xs font-semibold text-slate-500">
							Servers with custom settings
						</div>
					</div>
				</div>
			</div>

			<div className="grid gap-4.5">
				<ServerAlertDefaultsPanel
					error={serverAlertPolicy.error}
					isLoading={serverAlertPolicy.isLoading}
					isSaving={serverAlertPolicy.isSaving}
					onSavePolicy={serverAlertPolicy.savePolicy}
					policy={serverAlertPolicy.policy}
				/>

				<MonitorRuntimePanel
					error={monitorRuntime.error}
					isLoading={monitorRuntime.isLoading}
					isSaving={monitorRuntime.isSaving}
					onSaveSettings={monitorRuntime.saveSettings}
					settings={monitorRuntime.settings}
				/>
			</div>
		</section>
	);
}
