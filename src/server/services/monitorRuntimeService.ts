import type {
	MonitorRuntimeSettings,
	MonitorRuntimeSettingsUpdateInput,
} from "../../shared/types";
import type { MonitorRuntimeStore } from "../stores/monitorRuntimeStore";
import type { MonitorOverviewService } from "./monitorOverviewService";

type MonitorRuntimeListener = (settings: MonitorRuntimeSettings) => void;

export class MonitorRuntimeService {
	private readonly listeners = new Set<MonitorRuntimeListener>();

	constructor(
		private readonly monitorRuntimeStore: MonitorRuntimeStore,
		private readonly monitorOverviewService: MonitorOverviewService,
	) {}

	getSettings() {
		return this.monitorRuntimeStore.get();
	}

	getServerSettings(serverId: string) {
		return this.monitorRuntimeStore.getServerSettings(serverId);
	}

	updateSettings(input: MonitorRuntimeSettingsUpdateInput) {
		const settings = this.monitorRuntimeStore.replace(input);
		const didPruneHistory = this.monitorOverviewService.applyRetentionLimits();
		if (!didPruneHistory) this.monitorOverviewService.refreshOverview();
		this.notifySettingsUpdated(settings);

		return settings;
	}

	onSettingsUpdated(listener: MonitorRuntimeListener) {
		this.listeners.add(listener);

		return () => {
			this.listeners.delete(listener);
		};
	}

	private notifySettingsUpdated(settings: MonitorRuntimeSettings) {
		for (const listener of this.listeners) {
			listener(settings);
		}
	}
}
