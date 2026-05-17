import { HttpChecksPanel } from "@/widgets/httpChecks";
import { useMonitorShellContext } from "@/widgets/monitorShell";

export function HttpChecksPage() {
	const { httpCheckManager, now, overview } = useMonitorShellContext();

	return (
		<HttpChecksPanel
			activeCheckId={httpCheckManager.activeCheckId}
			checks={httpCheckManager.checks}
			error={httpCheckManager.error}
			isLoading={httpCheckManager.isLoading}
			isRunningAll={httpCheckManager.isRunningAll}
			isSaving={httpCheckManager.isSaving}
			now={now}
			onAddCheck={httpCheckManager.addCheck}
			onEditCheck={httpCheckManager.editCheck}
			onRemoveCheck={httpCheckManager.removeCheck}
			onRunAllChecks={httpCheckManager.runAllChecks}
			onRunCheck={httpCheckManager.runCheck}
			overview={overview}
		/>
	);
}
