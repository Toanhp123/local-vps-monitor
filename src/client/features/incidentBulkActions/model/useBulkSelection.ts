import { useState, useCallback } from "react";

export const useBulkSelection = (incidentIds: string[]) => {
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

	const isAllSelected = selectedIds.size === incidentIds.length && incidentIds.length > 0;
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
