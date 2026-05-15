import type { RequestHandler } from "express";
import { validateLocalAccessHeaders } from "../lib/localAccess";

export const localAccessGuard = (): RequestHandler => {
	return (request, response, next) => {
		const rejection = validateLocalAccessHeaders({
			host: request.header("host"),
			origin: request.header("origin"),
		});

		if (rejection) {
			response.status(403).json({ error: rejection });
			return;
		}

		next();
	};
};
