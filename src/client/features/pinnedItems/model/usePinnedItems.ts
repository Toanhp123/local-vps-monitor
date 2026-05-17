import { useCallback, useEffect, useMemo, useState } from "react";
import type { StoredServer } from "@shared/types";

const pinnedItemsStorageKey = "vps-monitor.pinnedItems.v1";

interface StoredPinnedItems {
	appGroupIdsByServerId?: Record<string, string[]>;
	serverIds?: string[];
}

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

const readPinnedItemsFromStorage = (): PinnedItemsState => {
	if (typeof window === "undefined") return emptyPinnedItems();

	try {
		const parsed = JSON.parse(
			window.localStorage.getItem(pinnedItemsStorageKey) || "{}",
		) as StoredPinnedItems;
		const appGroupIdsByServerId = new Map<string, Set<string>>();

		if (
			parsed.appGroupIdsByServerId &&
			typeof parsed.appGroupIdsByServerId === "object"
		) {
			for (const [serverId, groupIds] of Object.entries(
				parsed.appGroupIdsByServerId,
			)) {
				const validGroupIds = stringArray(groupIds);
				if (validGroupIds.length > 0) {
					appGroupIdsByServerId.set(serverId, new Set(validGroupIds));
				}
			}
		}

		return {
			appGroupIdsByServerId,
			serverIds: new Set(stringArray(parsed.serverIds)),
		};
	} catch {
		return emptyPinnedItems();
	}
};

const writePinnedItemsToStorage = (pinnedItems: PinnedItemsState) => {
	if (typeof window === "undefined") return;

	try {
		const appGroupIdsByServerId = Object.fromEntries(
			Array.from(pinnedItems.appGroupIdsByServerId.entries())
				.map(([serverId, groupIds]) => [serverId, Array.from(groupIds)] as const)
				.filter(([, groupIds]) => groupIds.length > 0),
		);

		window.localStorage.setItem(
			pinnedItemsStorageKey,
			JSON.stringify({
				appGroupIdsByServerId,
				serverIds: Array.from(pinnedItems.serverIds),
			}),
		);
	} catch {
		// Pinning still works in memory when localStorage is unavailable.
	}
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
		readPinnedItemsFromStorage(),
	);

	const isServerPinned = useCallback(
		(serverId: string) => pinnedItems.serverIds.has(serverId),
		[pinnedItems.serverIds],
	);

	const toggleServerPin = useCallback((serverId: string) => {
		setPinnedItems((current) => {
			const serverIds = new Set(current.serverIds);

			if (!serverIds.delete(serverId)) {
				serverIds.add(serverId);
			}

			return {
				...current,
				serverIds,
			};
		});
	}, []);

	const isAppGroupPinned = useCallback(
		(serverId: string, groupId: string) => {
			return (
				pinnedItems.appGroupIdsByServerId.get(serverId)?.has(groupId) ?? false
			);
		},
		[pinnedItems.appGroupIdsByServerId],
	);

	const toggleAppGroupPin = useCallback((serverId: string, groupId: string) => {
		setPinnedItems((current) => {
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
	}, []);

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

	useEffect(() => {
		writePinnedItemsToStorage(pinnedItems);
	}, [pinnedItems]);

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
