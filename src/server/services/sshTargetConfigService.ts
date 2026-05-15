import type {
	SshTargetCreateInput,
	SshTargetUpdateInput,
} from "../../shared/types";
import type { SshTargetConfigStore } from "../stores/sshTargetConfigStore";

export class SshTargetConfigService {
	constructor(private readonly targetConfigStore: SshTargetConfigStore) {}

	listTargets() {
		return this.targetConfigStore.list();
	}

	createTarget(input: SshTargetCreateInput) {
		return this.targetConfigStore.create(input);
	}

	createTargets(inputs: SshTargetCreateInput[]) {
		return this.targetConfigStore.createMany(inputs);
	}

	updateTarget(targetId: string, input: SshTargetUpdateInput) {
		return this.targetConfigStore.update(targetId, input);
	}

	deleteTarget(targetId: string) {
		return this.targetConfigStore.delete(targetId);
	}
}
