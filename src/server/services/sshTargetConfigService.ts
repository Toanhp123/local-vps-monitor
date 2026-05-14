import type { SshTargetCreateInput } from "../../shared/types";
import type { SshTargetConfigStore } from "../models/sshTargetConfigStore";

export class SshTargetConfigService {
  constructor(private readonly targetConfigStore: SshTargetConfigStore) {}

  listTargets() {
    return this.targetConfigStore.list();
  }

  createTarget(input: SshTargetCreateInput) {
    return this.targetConfigStore.create(input);
  }

  deleteTarget(targetId: string) {
    return this.targetConfigStore.delete(targetId);
  }
}
