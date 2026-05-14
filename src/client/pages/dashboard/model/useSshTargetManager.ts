import { useCallback, useEffect, useState } from "react";
import type { SshTarget, SshTargetCreateInput } from "../../../../shared/types";
import {
	createSshTarget,
	deleteSshTarget,
	fetchSshTargets,
	scanAllSshTargets,
	scanSshTarget,
} from "../../../shared/api/sshTargetsApi";

const scanAllId = "__all__";

const errorMessage = (error: unknown) => {
	return error instanceof Error ? error.message : String(error);
};

export function useSshTargetManager(onScanComplete?: () => void | Promise<void>) {
	const [targets, setTargets] = useState<SshTarget[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [activeScanId, setActiveScanId] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [lastScanMessage, setLastScanMessage] = useState("");

	const loadTargets = useCallback(async () => {
		setIsLoading(true);
		setError("");

		try {
			setTargets(await fetchSshTargets());
		} catch (requestError) {
			setError(errorMessage(requestError));
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadTargets();
	}, [loadTargets]);

	const refreshOverview = useCallback(async () => {
		if (!onScanComplete) return;

		try {
			await onScanComplete();
		} catch {
			// WebSocket should update the dashboard. Manual refresh is only a backup.
		}
	}, [onScanComplete]);

	const addTarget = useCallback(
		async (input: SshTargetCreateInput) => {
			setIsSaving(true);
			setError("");

			try {
				const target = await createSshTarget(input);
				setTargets((current) => [...current, target]);
				setLastScanMessage("");
				return true;
			} catch (requestError) {
				setError(errorMessage(requestError));
				return false;
			} finally {
				setIsSaving(false);
			}
		},
		[],
	);

	const removeTarget = useCallback(async (targetId: string) => {
		setError("");

		try {
			await deleteSshTarget(targetId);
			setTargets((current) =>
				current.filter((target) => target.id !== targetId),
			);
		} catch (requestError) {
			setError(errorMessage(requestError));
		}
	}, []);

	const scanTarget = useCallback(
		async (targetId: string) => {
			setActiveScanId(targetId);
			setError("");

			try {
				const result = await scanSshTarget(targetId);
				setLastScanMessage(
					`${result.serverName}: ${result.appCount} apps scanned`,
				);
				await refreshOverview();
			} catch (requestError) {
				setError(errorMessage(requestError));
			} finally {
				setActiveScanId(null);
			}
		},
		[refreshOverview],
	);

	const scanAllTargets = useCallback(async () => {
		setActiveScanId(scanAllId);
		setError("");

		try {
			const result = await scanAllSshTargets();
			setLastScanMessage(
				`${result.results.length} VPS scanned, ${result.errors.length} failed`,
			);
			if (result.errors.length > 0) {
				setError(result.errors.map((entry) => entry.message).join("; "));
			}
			await refreshOverview();
		} catch (requestError) {
			setError(errorMessage(requestError));
		} finally {
			setActiveScanId(null);
		}
	}, [refreshOverview]);

	return {
		activeScanId,
		addTarget,
		error,
		isLoading,
		isSaving,
		lastScanMessage,
		loadTargets,
		removeTarget,
		scanAllId,
		scanAllTargets,
		scanTarget,
		targets,
	};
}
