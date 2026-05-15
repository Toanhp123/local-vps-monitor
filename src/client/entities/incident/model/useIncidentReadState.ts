import { useCallback, useEffect, useState } from "react";
import type { IncidentEvent } from "../../../../shared/types";
import { getIncidentIds } from "./incidentGroups";

const maxStoredReadIncidentIds = 500;
const readIncidentStorageKey = "vps-monitor.readIncidentIds";

const readIdsFromStorage = () => {
	if (typeof window === "undefined") return new Set<string>();

	try {
		const parsed = JSON.parse(
			window.localStorage.getItem(readIncidentStorageKey) || "[]",
		) as unknown;

		return new Set(
			Array.isArray(parsed)
				? parsed.filter((value): value is string => typeof value === "string")
				: [],
		);
	} catch {
		return new Set<string>();
	}
};

const writeReadIdsToStorage = (readIds: Set<string>) => {
	if (typeof window === "undefined") return;

	try {
		window.localStorage.setItem(
			readIncidentStorageKey,
			JSON.stringify(Array.from(readIds).slice(-maxStoredReadIncidentIds)),
		);
	} catch {
		// The unread badge still works in memory when localStorage is unavailable.
	}
};

export const useIncidentReadState = (incidents: IncidentEvent[]) => {
	const [readIncidentIds, setReadIncidentIds] = useState<Set<string>>(() =>
		readIdsFromStorage(),
	);

	const markIncidentsRead = useCallback((incidentIds: string[]) => {
		if (incidentIds.length === 0) return;

		setReadIncidentIds((current) => {
			let changed = false;
			const next = new Set(current);

			for (const incidentId of incidentIds) {
				if (!next.has(incidentId)) {
					next.add(incidentId);
					changed = true;
				}
			}

			return changed ? next : current;
		});
	}, []);

	const markAllRead = useCallback(() => {
		markIncidentsRead(getIncidentIds(incidents));
	}, [incidents, markIncidentsRead]);

	useEffect(() => {
		writeReadIdsToStorage(readIncidentIds);
	}, [readIncidentIds]);

	useEffect(() => {
		setReadIncidentIds((current) => {
			if (current.size === 0) return current;

			const visibleIncidentIds = new Set(getIncidentIds(incidents));
			const retainedIds = Array.from(current).filter((incidentId) =>
				visibleIncidentIds.has(incidentId),
			);

			return retainedIds.length === current.size ? current : new Set(retainedIds);
		});
	}, [incidents]);

	return {
		markAllRead,
		markIncidentsRead,
		readIncidentIds,
	};
};
