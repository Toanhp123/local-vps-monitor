import { useState, useCallback } from "react";
import type { IncidentFilters } from "@/entities/incident/model/incidentFilters";
import { createEmptyFilters } from "@/entities/incident/model/incidentFilters";

export const useIncidentFilters = () => {
	const [filters, setFilters] = useState<IncidentFilters>(createEmptyFilters());

	const updateTextSearch = useCallback((text: string) => {
		setFilters((prev) => ({ ...prev, textSearch: text }));
	}, []);

	const toggleSeverity = useCallback((severity: string) => {
		setFilters((prev) => {
			const severities = new Set(prev.severities);
			if (severities.has(severity as any)) {
				severities.delete(severity as any);
			} else {
				severities.add(severity as any);
			}
			return { ...prev, severities };
		});
	}, []);

	const toggleKind = useCallback((kind: string) => {
		setFilters((prev) => {
			const kinds = new Set(prev.kinds);
			if (kinds.has(kind as any)) {
				kinds.delete(kind as any);
			} else {
				kinds.add(kind as any);
			}
			return { ...prev, kinds };
		});
	}, []);

	const toggleServer = useCallback((serverId: string) => {
		setFilters((prev) => {
			const serverIds = new Set(prev.serverIds);
			if (serverIds.has(serverId)) {
				serverIds.delete(serverId);
			} else {
				serverIds.add(serverId);
			}
			return { ...prev, serverIds };
		});
	}, []);

	const toggleApp = useCallback((appName: string) => {
		setFilters((prev) => {
			const appNames = new Set(prev.appNames);
			if (appNames.has(appName)) {
				appNames.delete(appName);
			} else {
				appNames.add(appName);
			}
			return { ...prev, appNames };
		});
	}, []);

	const setDateRange = useCallback((range: IncidentFilters["dateRange"]) => {
		setFilters((prev) => ({ ...prev, dateRange: range }));
	}, []);

	const setState = useCallback((state: IncidentFilters["state"]) => {
		setFilters((prev) => ({ ...prev, state }));
	}, []);

	const clearFilters = useCallback(() => {
		setFilters(createEmptyFilters());
	}, []);

	return {
		filters,
		updateTextSearch,
		toggleSeverity,
		toggleKind,
		toggleServer,
		toggleApp,
		setDateRange,
		setState,
		clearFilters,
	};
};
