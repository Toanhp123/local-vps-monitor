import { useOutletContext } from "react-router-dom";
import type { OverviewResponse, StoredServer } from "../../../../shared/types";
import type { useAppMonitoringRules } from "../../../features/appMonitoringRules/model/useAppMonitoringRules";
import type { useLocalDockerScanner } from "../../../features/localDockerScan/model/useLocalDockerScanner";
import type { useHttpCheckManager } from "../../../features/httpChecks/model/useHttpCheckManager";
import type { useSshTargetManager } from "../../../features/sshTargetManagement/model/useSshTargetManager";
import type { usePinnedItems } from "../../../features/pinnedItems/model/usePinnedItems";

export interface MonitorShellContext {
	activeScanId: string | null;
	appMonitoringRules: ReturnType<typeof useAppMonitoringRules>;
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
}

export function useMonitorShellContext() {
	return useOutletContext<MonitorShellContext>();
}
