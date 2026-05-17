import { useMonitorShellContext } from "@/widgets/monitorShell";
import { SshTargetManagerPanel } from "@/widgets/sshTargets";

export function SshTargetsPage() {
	const { isAnyScanActive, sshTargetManager } = useMonitorShellContext();
	const activeSshTargetScanId =
		sshTargetManager.activeScanSource === "targets-panel"
			? sshTargetManager.activeScanId
			: null;

	return (
		<SshTargetManagerPanel
			activeScanId={activeSshTargetScanId}
			activeTestId={sshTargetManager.activeTestId}
			error={sshTargetManager.error}
			isLoading={sshTargetManager.isLoading}
			isSaving={sshTargetManager.isSaving}
			isScanDisabled={isAnyScanActive}
			onAddTarget={sshTargetManager.addTarget}
			onBootstrapTarget={sshTargetManager.bootstrapTarget}
			onBulkImportTargets={sshTargetManager.bulkImportTargets}
			onEditTarget={sshTargetManager.editTarget}
			onRemoveTarget={sshTargetManager.removeTarget}
			onScanTarget={sshTargetManager.scanTarget}
			onTestTarget={sshTargetManager.testTarget}
			targets={sshTargetManager.targets}
		/>
	);
}
