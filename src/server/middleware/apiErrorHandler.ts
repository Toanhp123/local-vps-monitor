import type { ErrorRequestHandler } from "express";
import { apiErrorResponse } from "../errors/apiErrorMapping";

export const apiErrorHandler = (): ErrorRequestHandler => {
  return (error, _request, response, next) => {
    if (response.headersSent) {
      next(error);
      return;
    }

    const { body, statusCode } = apiErrorResponse(error);
    response.status(statusCode).json(body);
  };
};
