export interface ApiErrorOptions {
  cause?: unknown;
  details?: unknown;
  message?: string;
}

export interface ApiErrorBody {
  details?: unknown;
  error: string;
  message?: string;
}

export class ApiError extends Error {
  readonly details?: unknown;
  readonly error: string;
  readonly statusCode: number;

  constructor(statusCode: number, error: string, options: ApiErrorOptions = {}) {
    super(options.message || error);
    this.name = "ApiError";
    this.cause = options.cause;
    this.details = options.details;
    this.error = error;
    this.statusCode = statusCode;
  }

  toBody(): ApiErrorBody {
    return {
      error: this.error,
      ...(this.message !== this.error ? { message: this.message } : {}),
      ...(this.details !== undefined ? { details: this.details } : {})
    };
  }
}

export const apiError = (
  statusCode: number,
  error: string,
  options?: ApiErrorOptions
) => new ApiError(statusCode, error, options);
