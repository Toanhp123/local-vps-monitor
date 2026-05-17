import type { RequestHandler } from "express";
import { apiError } from "../errors/apiError";
import { paramString } from "../lib/httpParams";
import type { AppPolicyService } from "../services/appPolicyService";
import {
	appPolicyOverrideSchema,
	appPolicyCreateSchema,
	appPolicyUpdateSchema,
} from "../validators/appPolicySchema";

export class AppPoliciesController {
	constructor(private readonly appPolicyService: AppPolicyService) {}

	listPolicies: RequestHandler = (_request, response) => {
		const policies = this.appPolicyService.listPolicies();
		response.json({ policies, rules: policies });
	};

	createPolicy: RequestHandler = (request, response) => {
		const parsed = appPolicyCreateSchema.safeParse(request.body);
		if (!parsed.success) {
			throw apiError(400, "Invalid app policy", {
				details: parsed.error.flatten(),
			});
		}

		const policy = this.appPolicyService.createPolicy(parsed.data);
		response.status(201).json({ policy, rule: policy });
	};

	updatePolicy: RequestHandler = (request, response) => {
		const policyId = paramString(request.params.policyId);
		if (!policyId) throw apiError(400, "Missing app policy id");

		const parsed = appPolicyUpdateSchema.safeParse(request.body);
		if (!parsed.success) {
			throw apiError(400, "Invalid app policy update", {
				details: parsed.error.flatten(),
			});
		}

		const policy = this.appPolicyService.updatePolicy(policyId, parsed.data);
		if (!policy) throw apiError(404, "App policy not found");

		response.json({ policy, rule: policy });
	};

	upsertAppOverride: RequestHandler = (request, response) => {
		const parsed = appPolicyOverrideSchema.safeParse(request.body);
		if (!parsed.success) {
			throw apiError(400, "Invalid app policy override", {
				details: parsed.error.flatten(),
			});
		}

		const policy = this.appPolicyService.upsertAppOverride(parsed.data);
		response.json({ policy, rule: policy });
	};

	deletePolicy: RequestHandler = (request, response) => {
		const policyId = paramString(request.params.policyId);
		if (!policyId) throw apiError(400, "Missing app policy id");

		const deleted = this.appPolicyService.deletePolicy(policyId);
		if (!deleted) throw apiError(404, "App policy not found");

		response.status(204).send();
	};
}
