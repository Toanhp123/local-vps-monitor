import type { RequestHandler } from "express";
import { apiError } from "../errors/apiError";
import type { ServerAlertPolicyService } from "../services/serverAlertPolicyService";
import { serverAlertPolicyUpdateSchema } from "../validators/serverAlertPolicySchema";

export class ServerAlertPolicyController {
	constructor(private readonly serverAlertPolicyService: ServerAlertPolicyService) {}

	getPolicy: RequestHandler = (_request, response) => {
		response.json({ policy: this.serverAlertPolicyService.getPolicy() });
	};

	updatePolicy: RequestHandler = (request, response) => {
		const parsed = serverAlertPolicyUpdateSchema.safeParse(request.body);
		if (!parsed.success) {
			throw apiError(400, "Invalid alert policy", {
				details: parsed.error.flatten(),
			});
		}

		const policy = this.serverAlertPolicyService.updatePolicy(parsed.data);
		response.json({ policy });
	};
}
