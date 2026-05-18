import { useCallback, useEffect, useMemo, useState } from "react";
import type { PinnedItemsSnapshot, StoredServer } from "@shared/types";
import {
	fetchPinnedItems,
	savePinnedItems,
} from "@/shared/api/pinnedItemsApi";

interface PinnedItemsState {
	appGroupIdsByServerId: Map<string, Set<string>>;
	serverIds: Set<string>;
}

const emptyPinnedItems = (): PinnedItemsState => ({
	appGroupIdsByServerId: new Map<string, Set<string>>(),
	serverIds: new Set<string>(),
});

const stringArray = (value: unknown) => {
	return Array.isArray(value)
		? value.filter((item): item is string => typeof item === "string")
		: [];
};

const stateFromSnapshot = (
	snapshot: PinnedItemsSnapshot,
): PinnedItemsState => {
	const appGroupIdsByServerId = new Map<string, Set<string>>();

	for (const [serverId, groupIds] of Object.entries(
		snapshot.appGroupIdsByServerId,
	)) {
		const validGroupIds = stringArray(groupIds);
		if (validGroupIds.length > 0) {
			appGroupIdsByServerId.set(serverId, new Set(validGroupIds));
		}
	}

	return {
		appGroupIdsByServerId,
		serverIds: new Set(stringArray(snapshot.serverIds)),
	};
};

const snapshotFromState = (
	pinnedItems: PinnedItemsState,
): PinnedItemsSnapshot => {
	const appGroupIdsByServerId = Object.fromEntries(
		Array.from(pinnedItems.appGroupIdsByServerId.entries())
			.map(([serverId, groupIds]) => [serverId, Array.from(groupIds)] as const)
			.filter(([, groupIds]) => groupIds.length > 0),
	);

	return {
		appGroupIdsByServerId,
		serverIds: Array.from(pinnedItems.serverIds),
	};
};

const sortPinnedFirst = <T,>(
	items: T[],
	isPinned: (item: T) => boolean,
) => {
	if (!items.some(isPinned)) return items;

	return [...items].sort((first, second) => {
		const firstPinned = isPinned(first);
		const secondPinned = isPinned(second);

		if (firstPinned === secondPinned) return 0;

		return firstPinned ? -1 : 1;
	});
};

export const usePinnedItems = () => {
	const [pinnedItems, setPinnedItems] = useState<PinnedItemsState>(() =>
		emptyPinnedItems(),
	);

	useEffect(() => {
		let isMounted = true;

		void fetchPinnedItems()
			.then((snapshot) => {
				if (isMounted) setPinnedItems(stateFromSnapshot(snapshot));
			})
			.catch(() => {
				// Pinning still works in memory if the local API is unavailable.
			});

		return () => {
			isMounted = false;
		};
	}, []);

	const commitPinnedItems = useCallback(
		(update: (current: PinnedItemsState) => PinnedItemsState) => {
			setPinnedItems((current) => {
				const next = update(current);
				if (next === current) return current;

				void savePinnedItems(snapshotFromState(next)).catch(() => {
					// Keep UI responsive; the next pin action can retry persistence.
				});

				return next;
			});
		},
		[],
	);

	const isServerPinned = useCallback(
		(serverId: string) => pinnedItems.serverIds.has(serverId),
		[pinnedItems.serverIds],
	);

	const toggleServerPin = useCallback((serverId: string) => {
		commitPinnedItems((current) => {
			const serverIds = new Set(current.serverIds);

			if (!serverIds.delete(serverId)) {
				serverIds.add(serverId);
			}

			return {
				...current,
				serverIds,
			};
		});
	}, [commitPinnedItems]);

	const isAppGroupPinned = useCallback(
		(serverId: string, groupId: string) => {
			return (
				pinnedItems.appGroupIdsByServerId.get(serverId)?.has(groupId) ?? false
			);
		},
		[pinnedItems.appGroupIdsByServerId],
	);

	const toggleAppGroupPin = useCallback((serverId: string, groupId: string) => {
		commitPinnedItems((current) => {
			const appGroupIdsByServerId = new Map(current.appGroupIdsByServerId);
			const groupIds = new Set(appGroupIdsByServerId.get(serverId) || []);

			if (!groupIds.delete(groupId)) {
				groupIds.add(groupId);
			}

			if (groupIds.size > 0) {
				appGroupIdsByServerId.set(serverId, groupIds);
			} else {
				appGroupIdsByServerId.delete(serverId);
			}

			return {
				...current,
				appGroupIdsByServerId,
			};
		});
	}, [commitPinnedItems]);

	const sortServers = useCallback(
		(servers: StoredServer[]) => {
			return sortPinnedFirst(servers, (server) =>
				pinnedItems.serverIds.has(server.serverId),
			);
		},
		[pinnedItems.serverIds],
	);

	const sortAppGroups = useCallback(
		<T extends { id: string }>(serverId: string, groups: T[]) => {
			const pinnedGroupIds = pinnedItems.appGroupIdsByServerId.get(serverId);

			if (!pinnedGroupIds || pinnedGroupIds.size === 0) return groups;

			return sortPinnedFirst(groups, (group) => pinnedGroupIds.has(group.id));
		},
		[pinnedItems.appGroupIdsByServerId],
	);

	return useMemo(
		() => ({
			isAppGroupPinned,
			isServerPinned,
			sortAppGroups,
			sortServers,
			toggleAppGroupPin,
			toggleServerPin,
		}),
		[
			isAppGroupPinned,
			isServerPinned,
			sortAppGroups,
			sortServers,
			toggleAppGroupPin,
			toggleServerPin,
		],
	);
};
