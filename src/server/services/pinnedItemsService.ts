import type { PinnedItemsSnapshot } from "../../shared/types";
import type { PinnedItemsStore } from "../stores/pinnedItemsStore";

export class PinnedItemsService {
	constructor(private readonly pinnedItemsStore: PinnedItemsStore) {}

	getPinnedItems() {
		return this.pinnedItemsStore.get();
	}

	replacePinnedItems(input: PinnedItemsSnapshot) {
		return this.pinnedItemsStore.replace(input);
	}
}
