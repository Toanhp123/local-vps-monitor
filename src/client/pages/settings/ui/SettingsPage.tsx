import { useMonitorShellContext } from "@/widgets/monitorShell";
import { MonitorRuntimePanel } from "@/widgets/monitorRuntime";

export function SettingsPage() {
	const { monitorRuntime } = useMonitorShellContext();

	return (
		<section className="grid gap-4.5">
			<div>
				<h1 className="text-[34px] leading-tight font-extrabold text-slate-900 max-md:text-[28px]">
					System Settings
				</h1>
				<p className="mt-1 text-sm font-semibold text-slate-500">
					Global runtime defaults used when a server has no override.
				</p>
			</div>

			<MonitorRuntimePanel
				error={monitorRuntime.error}
				isLoading={monitorRuntime.isLoading}
				isSaving={monitorRuntime.isSaving}
				onSaveSettings={monitorRuntime.saveSettings}
				settings={monitorRuntime.settings}
			/>
		</section>
	);
}
