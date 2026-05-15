import type {
	SshTarget,
	SshTargetBootstrapInput,
	SshTargetBulkImportInput,
	SshTargetBulkImportResponse,
	SshTargetCreateInput,
} from "../../shared/types";
import { errorMessage } from "../lib/errorMessage";
import { settleWithConcurrency } from "../lib/settleWithConcurrency";

const importConcurrency = 4;

export interface SshTargetImportConfigWriter {
	createTargets(inputs: SshTargetCreateInput[]): SshTarget[];
}

export interface SshTargetBootstrapper {
	bootstrapTarget(input: SshTargetBootstrapInput): Promise<SshTarget>;
}

export interface SshTargetImportResult extends SshTargetBulkImportResponse {
	hasErrors: boolean;
}

export class SshTargetImportService {
	constructor(
		private readonly sshTargetConfigService: SshTargetImportConfigWriter,
		private readonly sshTargetBootstrapService: SshTargetBootstrapper,
		private readonly concurrency = importConcurrency,
	) {}

	async importTargets(
		input: SshTargetBulkImportInput,
	): Promise<SshTargetImportResult> {
		if (input.authMode === "key") {
			return {
				targets: this.sshTargetConfigService.createTargets(
					input.targets,
				),
				errors: [],
				hasErrors: false,
			};
		}

		const settled = await settleWithConcurrency(
			input.targets,
			this.concurrency,
			(target) => this.sshTargetBootstrapService.bootstrapTarget(target),
		);
		const body = settled.reduce<SshTargetBulkImportResponse>(
			(result, entry, index) => {
				const target = input.targets[index];

				if (entry.status === "fulfilled") {
					result.targets.push(entry.value);
				} else {
					result.errors.push({
						host: target?.host,
						index,
						message: errorMessage(entry.reason),
						name: target?.name,
					});
				}

				return result;
			},
			{ targets: [], errors: [] },
		);

		return {
			...body,
			hasErrors: body.errors.length > 0,
		};
	}
}
