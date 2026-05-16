import type { HttpCheck, HttpCheckResult } from "../../../shared/types";

export const httpCheckResultStatus = ({
	check,
	error,
	statusCode,
}: {
	check: HttpCheck;
	error?: string;
	statusCode?: number;
}): HttpCheckResult["status"] => {
	if (error || statusCode === undefined) return "down";

	if (
		statusCode >= check.expectedStatusMin &&
		statusCode <= check.expectedStatusMax
	) {
		return "healthy";
	}

	return statusCode >= 500 ? "down" : "warning";
};
