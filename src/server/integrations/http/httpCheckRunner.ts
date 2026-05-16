import type { HttpCheck, HttpCheckResult } from "../../../shared/types";
import { httpCheckResultStatus } from "../../domain/httpChecks/httpCheckStatus";
import { errorMessage } from "../../lib/errorMessage";

const elapsedMs = (startedAt: bigint) => {
	return Math.max(0, Math.round(Number(process.hrtime.bigint() - startedAt) / 1_000_000));
};

export class HttpCheckRunner {
	async run(check: HttpCheck): Promise<HttpCheckResult> {
		const checkedAt = new Date().toISOString();
		const startedAt = process.hrtime.bigint();
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), check.timeoutMs);

		try {
			const response = await fetch(check.url, {
				method: check.method,
				redirect: "follow",
				signal: controller.signal,
			});
			const latencyMs = elapsedMs(startedAt);
			const statusCode = response.status;

			return {
				checkedAt,
				latencyMs,
				status: httpCheckResultStatus({ check, statusCode }),
				statusCode,
			};
		} catch (error) {
			const message =
				error instanceof Error && error.name === "AbortError"
					? `Timed out after ${check.timeoutMs}ms`
					: errorMessage(error);

			return {
				checkedAt,
				error: message,
				latencyMs: elapsedMs(startedAt),
				status: httpCheckResultStatus({ check, error: message }),
			};
		} finally {
			clearTimeout(timer);
		}
	}
}
