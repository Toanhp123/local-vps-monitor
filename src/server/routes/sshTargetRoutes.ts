import { Router } from "express";
import { SshTargetsController } from "../controllers/sshTargetsController";
import type { SshScanService } from "../services/sshScanService";
import type { SshTargetConfigService } from "../services/sshTargetConfigService";

export const createSshTargetRouter = (
  sshTargetConfigService: SshTargetConfigService,
  sshScanService: SshScanService
) => {
  const router = Router();
  const sshTargetsController = new SshTargetsController(sshTargetConfigService, sshScanService);

  router.get("/ssh-targets", sshTargetsController.listTargets);
  router.post("/ssh-targets", sshTargetsController.createTarget);
  router.post("/ssh-targets/scan-all", sshTargetsController.scanAllTargets);
  router.post("/ssh-targets/:targetId/scan", sshTargetsController.scanTarget);
  router.delete("/ssh-targets/:targetId", sshTargetsController.deleteTarget);

  return router;
};
