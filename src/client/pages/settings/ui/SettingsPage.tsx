import { useState } from "react";
import { Activity, Settings2 } from "lucide-react";
import { ServerAlertPolicyPanel } from "@/widgets/serverAlertPolicy";
import { useMonitorShellContext } from "@/widgets/monitorShell";
import { MonitorRuntimePanel } from "@/widgets/monitorRuntime";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";

type SettingsTab = "system" | "alerts";
const settingsTabOptions = [
	{ icon: Settings2, label: "System", value: "system" },
	{ icon: Activity, label: "Server alerts", value: "alerts" },
] satisfies Array<{
	icon: typeof Settings2;
	label: string;
	value: SettingsTab;
}>;

export function SettingsPage() {
	const { serverAlertPolicy, overview, monitorRuntime } = useMonitorShellContext();
	const [activeTab, setActiveTab] = useState<SettingsTab>("system");

	return (
		<section className="grid gap-4.5">
			<div className="flex items-end justify-between gap-4 max-md:flex-col max-md:items-stretch">
				<h1 className="text-[34px] leading-tight font-extrabold text-slate-900 max-md:text-[28px]">
					Settings
				</h1>
				<SegmentedControl
					ariaLabel="Settings section"
					className="max-md:w-full"
					onChange={setActiveTab}
					options={settingsTabOptions}
					tone="dark"
					value={activeTab}
				/>
			</div>

			{activeTab === "system" ? (
				<MonitorRuntimePanel
					error={monitorRuntime.error}
					isLoading={monitorRuntime.isLoading}
					isSaving={monitorRuntime.isSaving}
					onSaveSettings={monitorRuntime.saveSettings}
					settings={monitorRuntime.settings}
				/>
			) : (
				<ServerAlertPolicyPanel
					error={serverAlertPolicy.error}
					isLoading={serverAlertPolicy.isLoading}
					isSaving={serverAlertPolicy.isSaving}
					onSavePolicy={serverAlertPolicy.savePolicy}
					policy={serverAlertPolicy.policy}
					servers={overview?.servers ?? []}
				/>
			)}
		</section>
	);
}
