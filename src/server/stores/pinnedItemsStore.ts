import type { PinnedItemsSnapshot } from "../../shared/types";
import { ConfigDocumentStore } from "./database/configDocumentStore";

const configKey = "pinned_items";
const maxPinnedIds = 500;

const emptyPinnedItems = (): PinnedItemsSnapshot => ({
	appGroupIdsByServerId: {},
	serverIds: [],
});

const normalizeIdList = (values: unknown) => {
	if (!Array.isArray(values)) return [];

	return Array.from(
		new Set(
			values
				.filter((value): value is string => typeof value === "string")
				.map((value) => value.trim())
				.filter(Boolean),
		),
	).slice(-maxPinnedIds);
};

const normalizeAppGroupPins = (value: unknown) => {
	if (!value || typeof value !== "object" || Array.isArray(value)) return {};

	const appGroupIdsByServerId: Record<string, string[]> = {};
	for (const [serverId, groupIds] of Object.entries(value)) {
		const normalizedServerId = serverId.trim();
		const normalizedGroupIds = normalizeIdList(groupIds);
		if (normalizedServerId && normalizedGroupIds.length > 0) {
			appGroupIdsByServerId[normalizedServerId] = normalizedGroupIds;
		}
	}

	return appGroupIdsByServerId;
};

const normalizePinnedItems = (value: unknown): PinnedItemsSnapshot => {
	if (!value || typeof value !== "object") return emptyPinnedItems();

	const snapshot = value as Partial<PinnedItemsSnapshot>;

	return {
		appGroupIdsByServerId: normalizeAppGroupPins(
			snapshot.appGroupIdsByServerId,
		),
		serverIds: normalizeIdList(snapshot.serverIds),
	};
};

export class PinnedItemsStore {
	private pinnedItems: PinnedItemsSnapshot;

	constructor(private readonly documents: ConfigDocumentStore) {
		this.pinnedItems = this.load();
	}

	get() {
		return this.pinnedItems;
	}

	replace(input: PinnedItemsSnapshot) {
		this.pinnedItems = normalizePinnedItems(input);
		this.save();

		return this.pinnedItems;
	}

	private load() {
		const persisted =
			this.documents.get<PinnedItemsSnapshot>(configKey);
		if (persisted) return normalizePinnedItems(persisted);

		const pinnedItems = emptyPinnedItems();
		this.documents.set(configKey, pinnedItems);
		return pinnedItems;
	}

	private save() {
		this.documents.set(configKey, this.pinnedItems);
	}
}
