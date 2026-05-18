import { useCallback, useEffect, useMemo, useState } from "react";

export const useBulkSelection = (incidentIds: string[]) => {
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const incidentIdSet = useMemo(() => new Set(incidentIds), [incidentIds]);

	useEffect(() => {
		setSelectedIds((current) => {
			if (current.size === 0) return current;

			const retainedIds = Array.from(current).filter((id) =>
				incidentIdSet.has(id),
			);

			return retainedIds.length === current.size
				? current
				: new Set(retainedIds);
		});
	}, [incidentIdSet]);

	const toggleSelection = useCallback((id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	}, []);

	const toggleAll = useCallback(() => {
		setSelectedIds((prev) => {
			if (prev.size === incidentIds.length) {
				return new Set();
			}
			return new Set(incidentIds);
		});
	}, [incidentIds]);

	const clearSelection = useCallback(() => {
		setSelectedIds(new Set());
	}, []);

	const isSelected = useCallback(
		(id: string) => selectedIds.has(id),
		[selectedIds],
	);

	const isAllSelected =
		selectedIds.size === incidentIds.length && incidentIds.length > 0;
	const isSomeSelected = selectedIds.size > 0 && selectedIds.size < incidentIds.length;

	return {
		selectedIds,
		toggleSelection,
		toggleAll,
		clearSelection,
		isSelected,
		isAllSelected,
		isSomeSelected,
		selectedCount: selectedIds.size,
	};
};
