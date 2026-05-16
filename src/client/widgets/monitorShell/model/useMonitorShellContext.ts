import { useOutletContext } from "react-router-dom";
import type { OverviewResponse, StoredServer } from "../../../../shared/types";
import type { useLocalDockerScanner } from "../../../features/localDockerScan/model/useLocalDockerScanner";
import type { useHttpCheckManager } from "../../../features/httpChecks/model/useHttpCheckManager";
import type { useSshTargetManager } from "../../../features/sshTargetManagement/model/useSshTargetManager";

export interface MonitorShellContext {
	activeScanId: string | null;
	filteredServers: StoredServer[];
	handleScanAll: () => void;
	handleScanServer: (serverId: string) => void;
	httpCheckManager: ReturnType<typeof useHttpCheckManager>;
	isAnyScanActive: boolean;
	isScanAllActive: boolean;
	localDockerScanner: ReturnType<typeof useLocalDockerScanner>;
	now: number;
	overview: OverviewResponse | null;
	query: string;
	setQuery: (query: string) => void;
	sshTargetManager: ReturnType<typeof useSshTargetManager>;
}

export function useMonitorShellContext() {
	return useOutletContext<MonitorShellContext>();
}
