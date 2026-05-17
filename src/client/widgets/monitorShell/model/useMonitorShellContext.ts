import { useOutletContext } from "react-router-dom";
import type { OverviewResponse, StoredServer } from "@shared/types";
import type { useServerAlertPolicy } from "@/features/serverAlertPolicy";
import type { useAppPolicies } from "@/features/appPolicies";
import type { useLocalDockerScanner } from "@/features/localDockerScan";
import type { useHttpCheckManager } from "@/features/httpChecks";
import type { useSshTargetManager } from "@/features/sshTargetManagement";
import type { usePinnedItems } from "@/features/pinnedItems";
import type { useMonitorRuntime } from "@/features/monitorRuntime";

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
