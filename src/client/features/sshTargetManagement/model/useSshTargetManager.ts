import { useCallback, useEffect, useState } from "react";
import type {
	SshTarget,
	SshTargetBootstrapInput,
	SshTargetBulkImportInput,
	SshTargetCreateInput,
	SshTargetUpdateInput,
} from "@shared/types";
import type { ToastState } from "@/shared/ui/Toast";
import {
	bootstrapSshTarget,
	bulkImportSshTargets,
	createSshTarget,
	deleteSshTarget,
	fetchSshTargets,
	scanAllSshTargets,
	scanSshTarget,
	testSshTarget,
	updateSshTarget,
} from "@/shared/api/sshTargetsApi";

const scanAllId = "__all__";

export type SshTargetScanSource = "targets-panel" | "server-list";

const errorMessage = (error: unknown) => {
	return error instanceof Error ? error.message : String(error);
};

export function useSshTargetManager(
	onScanComplete?: () => void | Promise<void>,
) {
	const [targets, setTargets] = useState<SshTarget[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [activeScanId, setActiveScanId] = useState<string | null>(null);
	const [activeTestId, setActiveTestId] = useState<string | null>(null);
	const [activeScanSource, setActiveScanSource] =
		useState<SshTargetScanSource | null>(null);
	const [error, setError] = useState("");
	const [toast, setToast] = useState<ToastState | null>(null);

	useEffect(() => {
		if (!toast) return undefined;

		const timer = window.setTimeout(() => {
			setToast(null);
		}, 3_500);

		return () => window.clearTimeout(timer);
	}, [toast]);

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

	const addTarget = useCallback(async (input: SshTargetCreateInput) => {
		setIsSaving(true);
		setError("");

		try {
			const target = await createSshTarget(input);
			setTargets((current) => [...current, target]);
			setToast({
				tone: "success",
				message: `${target.name} added`,
			});
			return true;
		} catch (requestError) {
			const message = errorMessage(requestError);
			setError(message);
			setToast({
				tone: "error",
				message,
			});
			return false;
		} finally {
			setIsSaving(false);
		}
	}, []);

	const bootstrapTarget = useCallback(
		async (input: SshTargetBootstrapInput) => {
			setIsSaving(true);
			setError("");

			try {
				const target = await bootstrapSshTarget(input);
				setTargets((current) => [...current, target]);
				setToast({
					tone: "success",
					message: `${target.name} added`,
				});
				return true;
			} catch (requestError) {
				const message = errorMessage(requestError);
				setError(message);
				setToast({
					tone: "error",
					message,
				});
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
			setToast({
				tone: "success",
				message: "SSH target deleted",
			});
		} catch (requestError) {
			const message = errorMessage(requestError);
			setError(message);
			setToast({
				tone: "error",
				message,
			});
		}
	}, []);

	const editTarget = useCallback(
		async (targetId: string, input: SshTargetUpdateInput) => {
			setIsSaving(true);
			setError("");

			try {
				const target = await updateSshTarget(targetId, input);
				setTargets((current) =>
					current.map((item) => (item.id === target.id ? target : item)),
				);
				setToast({
					tone: "success",
					message: `${target.name} updated`,
				});
				return true;
			} catch (requestError) {
				const message = errorMessage(requestError);
				setError(message);
				setToast({
					tone: "error",
					message,
				});
				return false;
			} finally {
				setIsSaving(false);
			}
		},
		[],
	);

	const bulkImportTargets = useCallback(async (input: SshTargetBulkImportInput) => {
		setIsSaving(true);
		setError("");

		try {
			const result = await bulkImportSshTargets(input);
			setTargets((current) => [...current, ...result.targets]);
			const errorMessageText = result.errors
				.map((entry) => `${entry.name || entry.host || `Row ${entry.index + 1}`}: ${entry.message}`)
				.join("; ");

			if (result.errors.length > 0) {
				setError(errorMessageText);
			}

			setToast({
				tone: result.errors.length > 0 ? "error" : "success",
				message: `${result.targets.length} imported, ${result.errors.length} failed`,
			});

			return result.errors.length === 0;
		} catch (requestError) {
			const message = errorMessage(requestError);
			setError(message);
			setToast({
				tone: "error",
				message,
			});
			return false;
		} finally {
			setIsSaving(false);
		}
	}, []);

	const testTarget = useCallback(async (targetId: string) => {
		setActiveTestId(targetId);
		setError("");

		try {
			const result = await testSshTarget(targetId);
			setToast({
				tone: result.ok ? "success" : "error",
				message: result.message,
			});
			if (!result.ok) {
				setError(result.message);
			}
		} catch (requestError) {
			const message = errorMessage(requestError);
			setError(message);
			setToast({
				tone: "error",
				message,
			});
		} finally {
			setActiveTestId(null);
		}
	}, []);

	const scanTarget = useCallback(
		async (
			targetId: string,
			source: SshTargetScanSource = "targets-panel",
		) => {
			setActiveScanId(targetId);
			setActiveScanSource(source);
			setError("");

			try {
				const result = await scanSshTarget(targetId);
				setToast({
					tone: "success",
					message: `${result.serverName}: ${result.appCount} apps scanned`,
				});
				await refreshOverview();
			} catch (requestError) {
				const message = errorMessage(requestError);
				setError(message);
				setToast({
					tone: "error",
					message,
				});
			} finally {
				setActiveScanId(null);
				setActiveScanSource(null);
			}
		},
		[refreshOverview],
	);

	const scanAllTargets = useCallback(async () => {
		setActiveScanId(scanAllId);
		setActiveScanSource(null);
		setError("");

		try {
			const result = await scanAllSshTargets();
			setToast({
				tone: result.errors.length > 0 ? "error" : "success",
				message: `${result.results.length} VPS scanned, ${result.errors.length} failed`,
			});
			if (result.errors.length > 0) {
				const message = result.errors
					.map((entry) => entry.message)
					.join("; ");
				setError(message);
				setToast({
					tone: "error",
					message,
				});
			}
			await refreshOverview();
		} catch (requestError) {
			const message = errorMessage(requestError);
			setError(message);
			setToast({
				tone: "error",
				message,
			});
		} finally {
			setActiveScanId(null);
		}
	}, [refreshOverview]);

	return {
		activeScanId,
		activeScanSource,
		activeTestId,
		addTarget,
		bootstrapTarget,
		bulkImportTargets,
		editTarget,
		error,
		isLoading,
		isSaving,
		loadTargets,
		removeTarget,
		scanAllId,
		scanAllTargets,
		scanTarget,
		testTarget,
		toast,
		targets,
	};
}
