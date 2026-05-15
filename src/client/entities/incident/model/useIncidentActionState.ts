import { useCallback, useEffect, useMemo, useState } from "react";
import type { IncidentEvent } from "../../../../shared/types";
import {
	getSnoozeUntil,
	type IncidentActionState,
	type SnoozePreset,
} from "./incidentActions";

const maxStoredIncidentActionIds = 500;
const actionStateStorageKey = "vps-monitor.incidentActions";

interface StoredIncidentActionState {
	acknowledgedIncidentIds?: string[];
	snoozedIncidents?: Array<{
		incidentId: string;
		snoozedUntil: number;
	}>;
}

const emptyActionState = (): IncidentActionState => ({
	acknowledgedIncidentIds: new Set<string>(),
	snoozedUntilByIncidentId: new Map<string, number>(),
});

const readActionStateFromStorage = (): IncidentActionState => {
	if (typeof window === "undefined") return emptyActionState();

	try {
		const parsed = JSON.parse(
			window.localStorage.getItem(actionStateStorageKey) || "{}",
		) as StoredIncidentActionState;

		const acknowledgedIncidentIds = new Set(
			Array.isArray(parsed.acknowledgedIncidentIds)
				? parsed.acknowledgedIncidentIds.filter(
						(value): value is string => typeof value === "string",
					)
				: [],
		);
		const snoozedUntilByIncidentId = new Map<string, number>();

		if (Array.isArray(parsed.snoozedIncidents)) {
			for (const snoozedIncident of parsed.snoozedIncidents) {
				if (
					typeof snoozedIncident.incidentId === "string" &&
					typeof snoozedIncident.snoozedUntil === "number"
				) {
					snoozedUntilByIncidentId.set(
						snoozedIncident.incidentId,
						snoozedIncident.snoozedUntil,
					);
				}
			}
		}

		return {
			acknowledgedIncidentIds,
			snoozedUntilByIncidentId,
		};
	} catch {
		return emptyActionState();
	}
};

const writeActionStateToStorage = (actionState: IncidentActionState) => {
	if (typeof window === "undefined") return;

	try {
		window.localStorage.setItem(
			actionStateStorageKey,
			JSON.stringify({
				acknowledgedIncidentIds: Array.from(
					actionState.acknowledgedIncidentIds,
				).slice(-maxStoredIncidentActionIds),
				snoozedIncidents: Array.from(
					actionState.snoozedUntilByIncidentId.entries(),
				)
					.slice(-maxStoredIncidentActionIds)
					.map(([incidentId, snoozedUntil]) => ({
						incidentId,
						snoozedUntil,
					})),
			}),
		);
	} catch {
		// The drawer still works in memory when localStorage is unavailable.
	}
};

export const useIncidentActionState = (
	incidents: IncidentEvent[],
	now: number,
) => {
	const [actionState, setActionState] = useState<IncidentActionState>(() =>
		readActionStateFromStorage(),
	);

	const acknowledgeIncident = useCallback((incidentId: string) => {
		setActionState((current) => {
			if (
				current.acknowledgedIncidentIds.has(incidentId) &&
				!current.snoozedUntilByIncidentId.has(incidentId)
			) {
				return current;
			}

			const acknowledgedIncidentIds = new Set(current.acknowledgedIncidentIds);
			const snoozedUntilByIncidentId = new Map(
				current.snoozedUntilByIncidentId,
			);

			acknowledgedIncidentIds.add(incidentId);
			snoozedUntilByIncidentId.delete(incidentId);

			return {
				acknowledgedIncidentIds,
				snoozedUntilByIncidentId,
			};
		});
	}, []);

	const snoozeIncident = useCallback(
		(incidentId: string, preset: SnoozePreset) => {
			setActionState((current) => {
				const acknowledgedIncidentIds = new Set(
					current.acknowledgedIncidentIds,
				);
				const snoozedUntilByIncidentId = new Map(
					current.snoozedUntilByIncidentId,
				);

				acknowledgedIncidentIds.delete(incidentId);
				snoozedUntilByIncidentId.set(incidentId, getSnoozeUntil(preset, now));

				return {
					acknowledgedIncidentIds,
					snoozedUntilByIncidentId,
				};
			});
		},
		[now],
	);

	const clearIncidentAction = useCallback((incidentId: string) => {
		setActionState((current) => {
			if (
				!current.acknowledgedIncidentIds.has(incidentId) &&
				!current.snoozedUntilByIncidentId.has(incidentId)
			) {
				return current;
			}

			const acknowledgedIncidentIds = new Set(current.acknowledgedIncidentIds);
			const snoozedUntilByIncidentId = new Map(
				current.snoozedUntilByIncidentId,
			);

			acknowledgedIncidentIds.delete(incidentId);
			snoozedUntilByIncidentId.delete(incidentId);

			return {
				acknowledgedIncidentIds,
				snoozedUntilByIncidentId,
			};
		});
	}, []);

	useEffect(() => {
		writeActionStateToStorage(actionState);
	}, [actionState]);

	useEffect(() => {
		if (incidents.length === 0) return;

		setActionState((current) => {
			const visibleIncidentIds = new Set(
				incidents.map((incident) => incident.id),
			);
			const acknowledgedIncidentIds = new Set(
				Array.from(current.acknowledgedIncidentIds).filter((incidentId) =>
					visibleIncidentIds.has(incidentId),
				),
			);
			const snoozedUntilByIncidentId = new Map(
				Array.from(current.snoozedUntilByIncidentId.entries()).filter(
					([incidentId]) => visibleIncidentIds.has(incidentId),
				),
			);

			if (
				acknowledgedIncidentIds.size ===
					current.acknowledgedIncidentIds.size &&
				snoozedUntilByIncidentId.size ===
					current.snoozedUntilByIncidentId.size
			) {
				return current;
			}

			return {
				acknowledgedIncidentIds,
				snoozedUntilByIncidentId,
			};
		});
	}, [incidents]);

	const stableActionState = useMemo<IncidentActionState>(
		() => ({
			acknowledgedIncidentIds: actionState.acknowledgedIncidentIds,
			snoozedUntilByIncidentId: actionState.snoozedUntilByIncidentId,
		}),
		[actionState],
	);

	return {
		acknowledgeIncident,
		actionState: stableActionState,
		clearIncidentAction,
		snoozeIncident,
	};
};
