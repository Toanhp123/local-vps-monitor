import type { RequestHandler } from "express";
import { apiError } from "../errors/apiError";
import { withApiErrorFallback } from "../errors/apiErrorMapping";
import { paramString } from "../lib/httpParams";
import type { HttpCheckService } from "../services/httpCheckService";
import {
	httpCheckCreateSchema,
	httpCheckUpdateSchema,
} from "../validators/httpCheckSchema";

export class HttpChecksController {
	constructor(private readonly httpCheckService: HttpCheckService) {}

	listChecks: RequestHandler = (_request, response) => {
		response.json({ checks: this.httpCheckService.listChecks() });
	};

	createCheck: RequestHandler = (request, response) => {
		const parsed = httpCheckCreateSchema.safeParse(request.body);
		if (!parsed.success) {
			throw apiError(400, "Invalid HTTP check", {
				details: parsed.error.flatten(),
			});
		}

		const check = this.httpCheckService.createCheck(parsed.data);
		response.status(201).json({ check });
	};

	updateCheck: RequestHandler = (request, response) => {
		const checkId = paramString(request.params.checkId);
		if (!checkId) throw apiError(400, "Missing HTTP check id");

		const parsed = httpCheckUpdateSchema.safeParse(request.body);
		if (!parsed.success) {
			throw apiError(400, "Invalid HTTP check update", {
				details: parsed.error.flatten(),
			});
		}

		const check = this.httpCheckService.updateCheck(checkId, parsed.data);
		if (!check) throw apiError(404, "HTTP check not found");

		response.json({ check });
	};

	deleteCheck: RequestHandler = (request, response) => {
		const checkId = paramString(request.params.checkId);
		if (!checkId) throw apiError(400, "Missing HTTP check id");

		const deleted = this.httpCheckService.deleteCheck(checkId);
		if (!deleted) throw apiError(404, "HTTP check not found");

		response.status(204).send();
	};

	runCheck: RequestHandler = async (request, response) => {
		const checkId = paramString(request.params.checkId);
		if (!checkId) throw apiError(400, "Missing HTTP check id");

		try {
			const check = await this.httpCheckService.runCheck(checkId);
			response.json({ check });
		} catch (error) {
			throw withApiErrorFallback(error, {
				error: "HTTP check failed",
				statusCode: 502,
			});
		}
	};

	runAllChecks: RequestHandler = async (_request, response) => {
		try {
			const result = await this.httpCheckService.runAllChecks();
			response.json(result);
		} catch (error) {
			throw withApiErrorFallback(error, {
				error: "HTTP checks failed",
				statusCode: 502,
			});
		}
	};
}
