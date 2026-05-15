import { useOutletContext } from "react-router-dom";
import type { OverviewResponse, StoredServer } from "../../../../shared/types";
import type { ServerViewFilter } from "../../../entities/server/model/serverViewFilter";
import type { useLocalDockerScanner } from "../../../features/localDockerScan/model/useLocalDockerScanner";
import type { useSshTargetManager } from "../../../features/sshTargetManagement/model/useSshTargetManager";

export interface MonitorPageContext {
	activeScanId: string | null;
	filteredServers: StoredServer[];
	handleScanAll: () => void;
	handleScanServer: (serverId: string) => void;
	isAnyScanActive: boolean;
	isScanAllActive: boolean;
	localDockerScanner: ReturnType<typeof useLocalDockerScanner>;
	now: number;
	overview: OverviewResponse | null;
	query: string;
	setQuery: (query: string) => void;
	sshTargetManager: ReturnType<typeof useSshTargetManager>;
	viewFilter: ServerViewFilter;
}

export function useMonitorPageContext() {
	return useOutletContext<MonitorPageContext>();
}
