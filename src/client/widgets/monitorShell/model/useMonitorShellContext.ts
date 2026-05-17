import { useOutletContext } from "react-router-dom";
import type { OverviewResponse, StoredServer } from "../../../../shared/types";
import type { useServerAlertPolicy } from "../../../features/serverAlertPolicy/model/useServerAlertPolicy";
import type { useAppPolicies } from "../../../features/appPolicies/model/useAppPolicies";
import type { useLocalDockerScanner } from "../../../features/localDockerScan/model/useLocalDockerScanner";
import type { useHttpCheckManager } from "../../../features/httpChecks/model/useHttpCheckManager";
import type { useSshTargetManager } from "../../../features/sshTargetManagement/model/useSshTargetManager";
import type { usePinnedItems } from "../../../features/pinnedItems/model/usePinnedItems";
import type { useMonitorRuntime } from "../../../features/monitorRuntime/model/useMonitorRuntime";

export interface MonitorShellContext {
	activeScanId: string | null;
	serverAlertPolicy: ReturnType<typeof useServerAlertPolicy>;
	appPolicies: ReturnType<typeof useAppPolicies>;
	filteredServers: StoredServer[];
	handleScanAll: () => void;
	handleScanServer: (serverId: string) => void;
	httpCheckManager: ReturnType<typeof useHttpCheckManager>;
	isAnyScanActive: boolean;
	isScanAllActive: boolean;
	localDockerScanner: ReturnType<typeof useLocalDockerScanner>;
	now: number;
	overview: OverviewResponse | null;
	pinnedItems: ReturnType<typeof usePinnedItems>;
	query: string;
	setQuery: (query: string) => void;
	sshTargetManager: ReturnType<typeof useSshTargetManager>;
	monitorRuntime: ReturnType<typeof useMonitorRuntime>;
}

export function useMonitorShellContext() {
	return useOutletContext<MonitorShellContext>();
}
