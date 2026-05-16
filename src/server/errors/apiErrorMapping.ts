import { AppLogsNotFoundError, AppLogsUnsupportedError } from "../services/appLogsService";
import { HttpCheckNotFoundError } from "../services/httpCheckService";
import {
  QuickActionNotFoundError,
  QuickActionUnsupportedError
} from "../services/quickActionService";
import { SshTargetNotFoundError } from "../services/sshScanService";
import { apiError, ApiError, type ApiErrorBody } from "./apiError";
import { errorMessage } from "../lib/errorMessage";

interface ApiErrorResponse {
  body: ApiErrorBody;
  statusCode: number;
}

interface ApiErrorFallback {
  error: string;
  statusCode: number;
}

const isHttpBodyParseError = (
  error: unknown
): error is { message?: string; status?: number; statusCode?: number; type?: string } => {
  if (!error || typeof error !== "object") return false;

  const value = error as {
    status?: unknown;
    statusCode?: unknown;
    type?: unknown;
  };

  return (
    (value.status === 400 || value.statusCode === 400) &&
    value.type === "entity.parse.failed"
  );
};

export const isKnownApiError = (error: unknown) => {
  return (
    error instanceof ApiError ||
    error instanceof AppLogsNotFoundError ||
    error instanceof AppLogsUnsupportedError ||
    error instanceof HttpCheckNotFoundError ||
    error instanceof QuickActionNotFoundError ||
    error instanceof QuickActionUnsupportedError ||
    error instanceof SshTargetNotFoundError ||
    isHttpBodyParseError(error)
  );
};

export const withApiErrorFallback = (
  error: unknown,
  fallback: ApiErrorFallback
) => {
  if (isKnownApiError(error)) return error;

  return apiError(fallback.statusCode, fallback.error, {
    cause: error,
    message: errorMessage(error)
  });
};

export const apiErrorResponse = (error: unknown): ApiErrorResponse => {
  if (error instanceof ApiError) {
    return {
      body: error.toBody(),
      statusCode: error.statusCode
    };
  }

  if (error instanceof AppLogsNotFoundError) {
    return {
      body: { error: "Logs target not found" },
      statusCode: 404
    };
  }

  if (error instanceof AppLogsUnsupportedError) {
    return {
      body: {
        error: "Logs are not supported for this app",
        message: error.message
      },
      statusCode: 400
    };
  }

  if (error instanceof QuickActionNotFoundError) {
    return {
      body: { error: error.message },
      statusCode: 404
    };
  }

  if (error instanceof HttpCheckNotFoundError) {
    return {
      body: { error: "HTTP check not found" },
      statusCode: 404
    };
  }

  if (error instanceof QuickActionUnsupportedError) {
    return {
      body: { error: error.message },
      statusCode: 400
    };
  }

  if (error instanceof SshTargetNotFoundError) {
    return {
      body: { error: "SSH target not found" },
      statusCode: 404
    };
  }

  if (isHttpBodyParseError(error)) {
    return {
      body: {
        error: "Invalid JSON body",
        message: errorMessage(error)
      },
      statusCode: 400
    };
  }

  return {
    body: {
      error: "Internal server error",
      message: errorMessage(error)
    },
    statusCode: 500
  };
};
