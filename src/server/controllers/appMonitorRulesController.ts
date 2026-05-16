import type { RequestHandler } from "express";
import { apiError } from "../errors/apiError";
import { paramString } from "../lib/httpParams";
import type { AppMonitorRuleService } from "../services/appMonitorRuleService";
import {
	appMonitorAppOverrideSchema,
	appMonitorRuleCreateSchema,
	appMonitorRuleUpdateSchema,
} from "../validators/appMonitorRuleSchema";

export class AppMonitorRulesController {
	constructor(private readonly appMonitorRuleService: AppMonitorRuleService) {}

	listRules: RequestHandler = (_request, response) => {
		response.json({ rules: this.appMonitorRuleService.listRules() });
	};

	createRule: RequestHandler = (request, response) => {
		const parsed = appMonitorRuleCreateSchema.safeParse(request.body);
		if (!parsed.success) {
			throw apiError(400, "Invalid app monitor rule", {
				details: parsed.error.flatten(),
			});
		}

		const rule = this.appMonitorRuleService.createRule(parsed.data);
		response.status(201).json({ rule });
	};

	updateRule: RequestHandler = (request, response) => {
		const ruleId = paramString(request.params.ruleId);
		if (!ruleId) throw apiError(400, "Missing app monitor rule id");

		const parsed = appMonitorRuleUpdateSchema.safeParse(request.body);
		if (!parsed.success) {
			throw apiError(400, "Invalid app monitor rule update", {
				details: parsed.error.flatten(),
			});
		}

		const rule = this.appMonitorRuleService.updateRule(ruleId, parsed.data);
		if (!rule) throw apiError(404, "App monitor rule not found");

		response.json({ rule });
	};

	upsertAppOverride: RequestHandler = (request, response) => {
		const parsed = appMonitorAppOverrideSchema.safeParse(request.body);
		if (!parsed.success) {
			throw apiError(400, "Invalid app monitor override", {
				details: parsed.error.flatten(),
			});
		}

		const rule = this.appMonitorRuleService.upsertAppOverride(parsed.data);
		response.json({ rule });
	};

	deleteRule: RequestHandler = (request, response) => {
		const ruleId = paramString(request.params.ruleId);
		if (!ruleId) throw apiError(400, "Missing app monitor rule id");

		const deleted = this.appMonitorRuleService.deleteRule(ruleId);
		if (!deleted) throw apiError(404, "App monitor rule not found");

		response.status(204).send();
	};
}
