import type { IncidentStateSnapshot } from "../../shared/types";
import type { IncidentStateStore } from "../stores/incidentStateStore";

export class IncidentStateService {
	constructor(private readonly incidentStateStore: IncidentStateStore) {}

	getState() {
		return this.incidentStateStore.get();
	}

	replaceState(input: IncidentStateSnapshot) {
		return this.incidentStateStore.replace(input);
	}
}
