import type { RequestHandler } from "express";
import { apiError } from "../errors/apiError";
import { withApiErrorFallback } from "../errors/apiErrorMapping";
import { paramString } from "../lib/httpParams";
import type { SshScanService } from "../services/sshScanService";
import type { SshTargetBootstrapService } from "../services/sshTargetBootstrapService";
import type { SshTargetConfigService } from "../services/sshTargetConfigService";
import type { SshTargetImportService } from "../services/sshTargetImportService";
import {
	sshTargetBootstrapSchema,
	sshTargetBulkImportSchema,
	sshTargetConfigCreateSchema,
	sshTargetConfigUpdateSchema,
} from "../validators/sshTargetConfigSchema";

export class SshTargetsController {
	constructor(
		private readonly sshTargetConfigService: SshTargetConfigService,
		private readonly sshScanService: SshScanService,
		private readonly sshTargetBootstrapService: SshTargetBootstrapService,
		private readonly sshTargetImportService: SshTargetImportService,
	) {}

	listTargets: RequestHandler = (_request, response) => {
		response.json({ targets: this.sshTargetConfigService.listTargets() });
	};

	createTarget: RequestHandler = (request, response) => {
		const parsed = sshTargetConfigCreateSchema.safeParse(request.body);
		if (!parsed.success) {
			throw apiError(400, "Invalid SSH target", {
				details: parsed.error.flatten(),
			});
		}

		const target = this.sshTargetConfigService.createTarget(parsed.data);
		response.status(201).json({ target });
	};

	updateTarget: RequestHandler = (request, response) => {
		const targetId = paramString(request.params.targetId);
		if (!targetId) {
			throw apiError(400, "Missing SSH target id");
		}

		const parsed = sshTargetConfigUpdateSchema.safeParse(request.body);
		if (!parsed.success) {
			throw apiError(400, "Invalid SSH target update", {
				details: parsed.error.flatten(),
			});
		}

		const target = this.sshTargetConfigService.updateTarget(
			targetId,
			parsed.data,
		);
		if (!target) {
			throw apiError(404, "SSH target not found");
		}

		response.json({ target });
	};

	bootstrapTarget: RequestHandler = async (request, response) => {
		const parsed = sshTargetBootstrapSchema.safeParse(request.body);
		if (!parsed.success) {
			throw apiError(400, "Invalid SSH target bootstrap input", {
				details: parsed.error.flatten(),
			});
		}

		try {
			const target = await this.sshTargetBootstrapService.bootstrapTarget(
				parsed.data,
			);
			response.status(201).json({ target });
		} catch (error) {
			throw withApiErrorFallback(error, {
				error: "SSH target setup failed",
				statusCode: 502,
			});
		}
	};

	bulkImportTargets: RequestHandler = async (request, response) => {
		const parsed = sshTargetBulkImportSchema.safeParse(request.body);
		if (!parsed.success) {
			throw apiError(400, "Invalid SSH target bulk import", {
				details: parsed.error.flatten(),
			});
		}

		try {
			const result = await this.sshTargetImportService.importTargets(
				parsed.data,
			);
			response.status(result.hasErrors ? 207 : 201).json({
				targets: result.targets,
				errors: result.errors,
			});
		} catch (error) {
			throw withApiErrorFallback(error, {
				error: "SSH target import failed",
				statusCode: 502,
			});
		}
	};

	deleteTarget: RequestHandler = (request, response) => {
		const targetId = paramString(request.params.targetId);
		if (!targetId) {
			throw apiError(400, "Missing SSH target id");
		}

		const deleted = this.sshTargetConfigService.deleteTarget(targetId);

		if (!deleted) {
			throw apiError(404, "SSH target not found");
		}

		response.status(204).send();
	};

	scanTarget: RequestHandler = async (request, response) => {
		const targetId = paramString(request.params.targetId);
		if (!targetId) {
			throw apiError(400, "Missing SSH target id");
		}

		try {
			const result = await this.sshScanService.scanTarget(targetId);
			response.json({ result });
		} catch (error) {
			throw withApiErrorFallback(error, {
				error: "SSH scan failed",
				statusCode: 502,
			});
		}
	};

	testTarget: RequestHandler = async (request, response) => {
		const targetId = paramString(request.params.targetId);
		if (!targetId) {
			throw apiError(400, "Missing SSH target id");
		}

		try {
			const result = await this.sshScanService.testTarget(targetId);
			response.json({ result });
		} catch (error) {
			throw withApiErrorFallback(error, {
				error: "SSH test failed",
				statusCode: 502,
			});
		}
	};

	scanAllTargets: RequestHandler = async (_request, response) => {
		try {
			const result = await this.sshScanService.scanAllTargets();
			response.json(result);
		} catch (error) {
			throw withApiErrorFallback(error, {
				error: "SSH scan failed",
				statusCode: 502,
			});
		}
	};
}
