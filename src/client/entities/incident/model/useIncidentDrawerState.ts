import { useCallback, useEffect, useMemo, useState } from "react";
import type {
	IncidentStateSnapshot,
	IncidentEvent,
} from "../../../../shared/types";
import {
	fetchIncidentState,
	saveIncidentState,
} from "../../../shared/api/incidentStateApi";
import {
	getSnoozeUntil,
	type IncidentDrawerState,
	type SnoozePreset,
} from "./incidentState";
import { getIncidentIds } from "./incidentGroups";

interface IncidentUiState extends IncidentDrawerState {
	readIncidentIds: Set<string>;
}

const emptyActionState = (): IncidentUiState => ({
	acknowledgedIncidentIds: new Set<string>(),
	readIncidentIds: new Set<string>(),
	snoozedUntilByIncidentId: new Map<string, number>(),
});

const stateFromSnapshot = (
	snapshot: IncidentStateSnapshot,
): IncidentUiState => ({
	acknowledgedIncidentIds: new Set(snapshot.acknowledgedIncidentIds),
	readIncidentIds: new Set(snapshot.readIncidentIds),
	snoozedUntilByIncidentId: new Map(
		snapshot.snoozedIncidents.map((incident) => [
			incident.incidentId,
			incident.snoozedUntil,
		]),
	),
});

const snapshotFromState = (
	state: IncidentUiState,
): IncidentStateSnapshot => ({
	acknowledgedIncidentIds: Array.from(state.acknowledgedIncidentIds),
	readIncidentIds: Array.from(state.readIncidentIds),
	snoozedIncidents: Array.from(
		state.snoozedUntilByIncidentId.entries(),
	).map(([incidentId, snoozedUntil]) => ({ incidentId, snoozedUntil })),
});

export const useIncidentDrawerState = (
	incidents: IncidentEvent[],
	now: number,
) => {
	const [incidentState, setActionState] = useState<IncidentUiState>(() =>
		emptyActionState(),
	);

	useEffect(() => {
		let isMounted = true;

		void fetchIncidentState()
			.then((snapshot) => {
				if (isMounted) setActionState(stateFromSnapshot(snapshot));
			})
			.catch(() => {
				// Incident actions still work in memory if the local API is unavailable.
			});

		return () => {
			isMounted = false;
		};
	}, []);

	const commitActionState = useCallback(
		(
			update: (
				current: IncidentUiState,
			) => IncidentUiState,
		) => {
			setActionState((current) => {
				const next = update(current);
				if (next === current) return current;

				void saveIncidentState(snapshotFromState(next)).catch(() => {
					// Keep UI responsive; the next action can retry persistence.
				});

				return next;
			});
		},
		[],
	);

	const markIncidentsRead = useCallback(
		(incidentIds: string[]) => {
			if (incidentIds.length === 0) return;

			commitActionState((current) => {
				let changed = false;
				const readIncidentIds = new Set(current.readIncidentIds);

				for (const incidentId of incidentIds) {
					if (!readIncidentIds.has(incidentId)) {
						readIncidentIds.add(incidentId);
						changed = true;
					}
				}

				return changed
					? {
							...current,
							readIncidentIds,
						}
					: current;
			});
		},
		[commitActionState],
	);

	const markIncidentsUnread = useCallback(
		(incidentIds: string[]) => {
			if (incidentIds.length === 0) return;

			commitActionState((current) => {
				let changed = false;
				const readIncidentIds = new Set(current.readIncidentIds);

				for (const incidentId of incidentIds) {
					if (readIncidentIds.delete(incidentId)) changed = true;
				}

				return changed
					? {
							...current,
							readIncidentIds,
						}
					: current;
			});
		},
		[commitActionState],
	);

	const markAllRead = useCallback(() => {
		markIncidentsRead(getIncidentIds(incidents));
	}, [incidents, markIncidentsRead]);

	const acknowledgeIncident = useCallback(
		(incidentId: string) => {
			commitActionState((current) => {
				if (
					current.acknowledgedIncidentIds.has(incidentId) &&
					!current.snoozedUntilByIncidentId.has(incidentId)
				) {
					return current;
				}

				const acknowledgedIncidentIds = new Set(
					current.acknowledgedIncidentIds,
				);
				const snoozedUntilByIncidentId = new Map(
					current.snoozedUntilByIncidentId,
				);

				acknowledgedIncidentIds.add(incidentId);
				snoozedUntilByIncidentId.delete(incidentId);

				return {
					...current,
					acknowledgedIncidentIds,
					snoozedUntilByIncidentId,
				};
			});
		},
		[commitActionState],
	);

	const snoozeIncident = useCallback(
		(incidentId: string, preset: SnoozePreset) => {
			commitActionState((current) => {
				const acknowledgedIncidentIds = new Set(
					current.acknowledgedIncidentIds,
				);
				const snoozedUntilByIncidentId = new Map(
					current.snoozedUntilByIncidentId,
				);

				acknowledgedIncidentIds.delete(incidentId);
				snoozedUntilByIncidentId.set(
					incidentId,
					getSnoozeUntil(preset, now),
				);

				return {
					...current,
					acknowledgedIncidentIds,
					snoozedUntilByIncidentId,
				};
			});
		},
		[commitActionState, now],
	);

	const clearIncidentState = useCallback(
		(incidentId: string) => {
			commitActionState((current) => {
				if (
					!current.acknowledgedIncidentIds.has(incidentId) &&
					!current.snoozedUntilByIncidentId.has(incidentId)
				) {
					return current;
				}

				const acknowledgedIncidentIds = new Set(
					current.acknowledgedIncidentIds,
				);
				const snoozedUntilByIncidentId = new Map(
					current.snoozedUntilByIncidentId,
				);

				acknowledgedIncidentIds.delete(incidentId);
				snoozedUntilByIncidentId.delete(incidentId);

				return {
					...current,
					acknowledgedIncidentIds,
					snoozedUntilByIncidentId,
				};
			});
		},
		[commitActionState],
	);

	useEffect(() => {
		if (incidents.length === 0) return;

		commitActionState((current) => {
			const visibleIncidentIds = new Set(getIncidentIds(incidents));
			const readIncidentIds = new Set(
				Array.from(current.readIncidentIds).filter((incidentId) =>
					visibleIncidentIds.has(incidentId),
				),
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
				readIncidentIds.size === current.readIncidentIds.size &&
				acknowledgedIncidentIds.size ===
					current.acknowledgedIncidentIds.size &&
				snoozedUntilByIncidentId.size ===
					current.snoozedUntilByIncidentId.size
			) {
				return current;
			}

			return {
				acknowledgedIncidentIds,
				readIncidentIds,
				snoozedUntilByIncidentId,
			};
		});
	}, [commitActionState, incidents]);

	const stableActionState = useMemo<IncidentDrawerState>(
		() => ({
			acknowledgedIncidentIds: incidentState.acknowledgedIncidentIds,
			snoozedUntilByIncidentId: incidentState.snoozedUntilByIncidentId,
		}),
		[incidentState],
	);

	return {
		acknowledgeIncident,
		incidentState: stableActionState,
		clearIncidentState,
		markAllRead,
		markIncidentsRead,
		markIncidentsUnread,
		readIncidentIds: incidentState.readIncidentIds,
		snoozeIncident,
	};
};
