import type { RequestHandler } from "express";
import { withApiErrorFallback } from "../errors/apiErrorMapping";
import type { LocalDockerScanService } from "../services/localDockerScanService";

export class LocalDockerController {
	constructor(
		private readonly localDockerScanService: LocalDockerScanService,
	) {}

	scanLocalDocker: RequestHandler = async (_request, response) => {
		try {
			const result = await this.localDockerScanService.scanLocalDocker();
			response.json({ result });
		} catch (error) {
			throw withApiErrorFallback(error, {
				error: "Local Docker scan failed",
				statusCode: 502,
			});
		}
	};
}
