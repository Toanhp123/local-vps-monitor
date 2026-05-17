import { useCallback, useEffect, useState } from "react";
import type {
	HttpCheck,
	HttpCheckCreateInput,
	HttpCheckUpdateInput,
} from "@shared/types";
import {
	createHttpCheck,
	deleteHttpCheck,
	fetchHttpChecks,
	runAllHttpChecks,
	runHttpCheck,
	updateHttpCheck,
} from "@/shared/api/httpChecksApi";
import type { ToastState } from "@/shared/ui/Toast";

const errorMessage = (error: unknown) => {
	return error instanceof Error ? error.message : String(error);
};

export function useHttpCheckManager(
	onRunComplete?: () => void | Promise<void>,
) {
	const [checks, setChecks] = useState<HttpCheck[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [activeCheckId, setActiveCheckId] = useState<string | null>(null);
	const [isRunningAll, setIsRunningAll] = useState(false);
	const [error, setError] = useState("");
	const [toast, setToast] = useState<ToastState | null>(null);

	useEffect(() => {
		if (!toast) return undefined;

		const timer = window.setTimeout(() => setToast(null), 3_500);
		return () => window.clearTimeout(timer);
	}, [toast]);

	const loadChecks = useCallback(async () => {
		setIsLoading(true);
		setError("");

		try {
			setChecks(await fetchHttpChecks());
		} catch (requestError) {
			setError(errorMessage(requestError));
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadChecks();
	}, [loadChecks]);

	const refreshOverview = useCallback(async () => {
		if (!onRunComplete) return;

		try {
			await onRunComplete();
		} catch {
			// Overview also updates through WebSocket when linked incidents are created.
		}
	}, [onRunComplete]);

	const addCheck = useCallback(async (input: HttpCheckCreateInput) => {
		setIsSaving(true);
		setError("");

		try {
			const check = await createHttpCheck(input);
			setChecks((current) => [...current, check]);
			setToast({ tone: "success", message: `${check.name} added` });
			return true;
		} catch (requestError) {
			const message = errorMessage(requestError);
			setError(message);
			setToast({ tone: "error", message });
			return false;
		} finally {
			setIsSaving(false);
		}
	}, []);

	const editCheck = useCallback(
		async (checkId: string, input: HttpCheckUpdateInput) => {
			setIsSaving(true);
			setError("");

			try {
				const check = await updateHttpCheck(checkId, input);
				setChecks((current) =>
					current.map((item) => (item.id === check.id ? check : item)),
				);
				setToast({ tone: "success", message: `${check.name} updated` });
				return true;
			} catch (requestError) {
				const message = errorMessage(requestError);
				setError(message);
				setToast({ tone: "error", message });
				return false;
			} finally {
				setIsSaving(false);
			}
		},
		[],
	);

	const removeCheck = useCallback(async (checkId: string) => {
		setError("");

		try {
			await deleteHttpCheck(checkId);
			setChecks((current) => current.filter((check) => check.id !== checkId));
			setToast({ tone: "success", message: "HTTP check deleted" });
		} catch (requestError) {
			const message = errorMessage(requestError);
			setError(message);
			setToast({ tone: "error", message });
		}
	}, []);

	const runCheck = useCallback(
		async (checkId: string) => {
			setActiveCheckId(checkId);
			setError("");

			try {
				const check = await runHttpCheck(checkId);
				setChecks((current) =>
					current.map((item) => (item.id === check.id ? check : item)),
				);
				setToast({
					tone: check.lastResult?.status === "healthy" ? "success" : "error",
					message: `${check.name}: ${check.lastResult?.status ?? "unknown"}`,
				});
				await refreshOverview();
			} catch (requestError) {
				const message = errorMessage(requestError);
				setError(message);
				setToast({ tone: "error", message });
			} finally {
				setActiveCheckId(null);
			}
		},
		[refreshOverview],
	);

	const runAllChecks = useCallback(async () => {
		setIsRunningAll(true);
		setError("");

		try {
			const result = await runAllHttpChecks();
			setChecks((current) => {
				const byId = new Map(result.results.map((check) => [check.id, check]));
				return current.map((check) => byId.get(check.id) ?? check);
			});
			const unhealthy = result.results.filter(
				(check) => check.lastResult?.status !== "healthy",
			).length;
			setToast({
				tone: result.errors.length > 0 || unhealthy > 0 ? "error" : "success",
				message: `${result.results.length} checks run, ${unhealthy} unhealthy`,
			});
			if (result.errors.length > 0) {
				setError(result.errors.map((entry) => entry.message).join("; "));
			}
			await refreshOverview();
		} catch (requestError) {
			const message = errorMessage(requestError);
			setError(message);
			setToast({ tone: "error", message });
		} finally {
			setIsRunningAll(false);
		}
	}, [refreshOverview]);

	return {
		activeCheckId,
		addCheck,
		checks,
		editCheck,
		error,
		isLoading,
		isRunningAll,
		isSaving,
		loadChecks,
		removeCheck,
		runAllChecks,
		runCheck,
		toast,
	};
}
