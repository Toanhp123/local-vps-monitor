import type {
	HttpCheck,
	HttpCheckCreateInput,
	HttpCheckRunAllResponse,
	HttpCheckUpdateInput,
} from "../../shared/types";
import { createHttpCheckIncident } from "../domain/httpChecks/httpCheckIncidents";
import { HttpCheckRunner } from "../integrations/http/httpCheckRunner";
import { errorMessage } from "../lib/errorMessage";
import { settleWithConcurrency } from "../lib/settleWithConcurrency";
import type { HttpCheckConfigStore } from "../stores/httpCheckConfigStore";
import type { MonitorOverviewService } from "./monitorOverviewService";

export class HttpCheckNotFoundError extends Error {
	constructor(checkId: string) {
		super(`HTTP check not found: ${checkId}`);
		this.name = "HttpCheckNotFoundError";
	}
}

export class HttpCheckService {
	private readonly runner = new HttpCheckRunner();

	constructor(
		private readonly httpCheckConfigStore: HttpCheckConfigStore,
		private readonly monitorOverviewService: MonitorOverviewService,
		private readonly concurrency: () => number,
	) {}

	listChecks() {
		return this.httpCheckConfigStore.list();
	}

	createCheck(input: HttpCheckCreateInput) {
		return this.httpCheckConfigStore.create(input);
	}

	updateCheck(checkId: string, input: HttpCheckUpdateInput) {
		return this.httpCheckConfigStore.update(checkId, input);
	}

	deleteCheck(checkId: string) {
		return this.httpCheckConfigStore.delete(checkId);
	}

	async runCheck(checkId: string) {
		const check = this.httpCheckConfigStore.get(checkId);
		if (!check) throw new HttpCheckNotFoundError(checkId);

		return this.runKnownCheck(check);
	}

	async runAllChecks(): Promise<HttpCheckRunAllResponse> {
		const checks = this.httpCheckConfigStore
			.list()
			.filter((check) => check.enabled);
		const settled = await settleWithConcurrency(
			checks,
			this.concurrency(),
			(check) => this.runKnownCheck(check),
		);

		return settled.reduce<HttpCheckRunAllResponse>(
			(response, result, index) => {
				if (result.status === "fulfilled") {
					response.results.push(result.value);
				} else {
					response.errors.push({
						checkId: checks[index]?.id || "unknown",
						message: errorMessage(result.reason),
					});
				}

				return response;
			},
			{ errors: [], results: [] },
		);
	}

	private async runKnownCheck(check: HttpCheck) {
		const previousResult = check.lastResult;
		const result = await this.runner.run(check);
		const updatedCheck = this.httpCheckConfigStore.updateResult(
			check.id,
			result,
		);

		if (!updatedCheck) throw new HttpCheckNotFoundError(check.id);

		const server = check.serverId
			? this.monitorOverviewService.getServer(check.serverId)
			: undefined;
		if (server) {
			const incident = createHttpCheckIncident({
				check: updatedCheck,
				previousResult,
				result,
				server,
			});

			if (incident) {
				this.monitorOverviewService.appendServerIncident(
					server.serverId,
					incident,
				);
			}
		}

		return updatedCheck;
	}
}
