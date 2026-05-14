import type { RequestHandler } from "express";
import { SshScanService, SshTargetNotFoundError } from "../services/sshScanService";
import { sshTargetConfigCreateSchema } from "../validators/sshTargetConfigSchema";

const errorMessage = (error: unknown) => {
  return error instanceof Error ? error.message : String(error);
};

const paramString = (value: string | string[] | undefined) => {
  return Array.isArray(value) ? value[0] : value;
};

export class SshTargetsController {
  constructor(private readonly sshScanService: SshScanService) {}

  listTargets: RequestHandler = (_request, response) => {
    response.json({ targets: this.sshScanService.listTargets() });
  };

  createTarget: RequestHandler = (request, response) => {
    const parsed = sshTargetConfigCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: "Invalid SSH target", details: parsed.error.flatten() });
      return;
    }

    const target = this.sshScanService.createTarget(parsed.data);
    response.status(201).json({ target });
  };

  deleteTarget: RequestHandler = (request, response) => {
    const targetId = paramString(request.params.targetId);
    if (!targetId) {
      response.status(400).json({ error: "Missing SSH target id" });
      return;
    }

    const deleted = this.sshScanService.deleteTarget(targetId);

    if (!deleted) {
      response.status(404).json({ error: "SSH target not found" });
      return;
    }

    response.status(204).send();
  };

  scanTarget: RequestHandler = async (request, response) => {
    const targetId = paramString(request.params.targetId);
    if (!targetId) {
      response.status(400).json({ error: "Missing SSH target id" });
      return;
    }

    try {
      const result = await this.sshScanService.scanTarget(targetId);
      response.json({ result });
    } catch (error) {
      if (error instanceof SshTargetNotFoundError) {
        response.status(404).json({ error: "SSH target not found" });
        return;
      }

      response.status(502).json({ error: "SSH scan failed", message: errorMessage(error) });
    }
  };

  scanAllTargets: RequestHandler = async (_request, response) => {
    const result = await this.sshScanService.scanAllTargets();
    response.json(result);
  };
}
