import type { RequestHandler } from "express";
import { errorMessage } from "../lib/errorMessage";
import { SshScanService, SshTargetNotFoundError } from "../services/sshScanService";
import type { SshTargetBootstrapService } from "../services/sshTargetBootstrapService";
import type { SshTargetConfigService } from "../services/sshTargetConfigService";
import {
  sshTargetBootstrapSchema,
  sshTargetBulkImportSchema,
  sshTargetConfigCreateSchema,
  sshTargetConfigUpdateSchema
} from "../validators/sshTargetConfigSchema";

const paramString = (value: string | string[] | undefined) => {
  return Array.isArray(value) ? value[0] : value;
};

const importConcurrency = 4;

const settleWithConcurrency = async <Input, Output>(
  items: Input[],
  task: (item: Input, index: number) => Promise<Output>
) => {
  const results = new Array<PromiseSettledResult<Output>>(items.length);
  let nextIndex = 0;

  await Promise.all(
    Array.from({ length: Math.min(importConcurrency, items.length) }, async () => {
      while (nextIndex < items.length) {
        const index = nextIndex;
        nextIndex += 1;

        try {
          results[index] = {
            status: "fulfilled",
            value: await task(items[index], index)
          };
        } catch (reason) {
          results[index] = {
            status: "rejected",
            reason
          };
        }
      }
    })
  );

  return results;
};

export class SshTargetsController {
  constructor(
    private readonly sshTargetConfigService: SshTargetConfigService,
    private readonly sshScanService: SshScanService,
    private readonly sshTargetBootstrapService: SshTargetBootstrapService
  ) {}

  listTargets: RequestHandler = (_request, response) => {
    response.json({ targets: this.sshTargetConfigService.listTargets() });
  };

  createTarget: RequestHandler = (request, response) => {
    const parsed = sshTargetConfigCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: "Invalid SSH target", details: parsed.error.flatten() });
      return;
    }

    const target = this.sshTargetConfigService.createTarget(parsed.data);
    response.status(201).json({ target });
  };

  updateTarget: RequestHandler = (request, response) => {
    const targetId = paramString(request.params.targetId);
    if (!targetId) {
      response.status(400).json({ error: "Missing SSH target id" });
      return;
    }

    const parsed = sshTargetConfigUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: "Invalid SSH target update", details: parsed.error.flatten() });
      return;
    }

    const target = this.sshTargetConfigService.updateTarget(targetId, parsed.data);
    if (!target) {
      response.status(404).json({ error: "SSH target not found" });
      return;
    }

    response.json({ target });
  };

  bootstrapTarget: RequestHandler = async (request, response) => {
    const parsed = sshTargetBootstrapSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: "Invalid SSH target bootstrap input", details: parsed.error.flatten() });
      return;
    }

    try {
      const target = await this.sshTargetBootstrapService.bootstrapTarget(parsed.data);
      response.status(201).json({ target });
    } catch (error) {
      response.status(502).json({ error: "SSH target setup failed", message: errorMessage(error) });
    }
  };

  bulkImportTargets: RequestHandler = async (request, response) => {
    const parsed = sshTargetBulkImportSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: "Invalid SSH target bulk import", details: parsed.error.flatten() });
      return;
    }

    if (parsed.data.authMode === "key") {
      const targets = this.sshTargetConfigService.createTargets(parsed.data.targets);
      response.status(201).json({ targets, errors: [] });
      return;
    }

    const settled = await settleWithConcurrency(parsed.data.targets, (target) =>
      this.sshTargetBootstrapService.bootstrapTarget(target)
    );
    const body = settled.reduce<{
      targets: ReturnType<SshTargetConfigService["listTargets"]>;
      errors: Array<{ host?: string; index: number; message: string; name?: string }>;
    }>(
      (result, entry, index) => {
        const input = parsed.data.targets[index];

        if (entry.status === "fulfilled") {
          result.targets.push(entry.value);
        } else {
          result.errors.push({
            host: input?.host,
            index,
            message: errorMessage(entry.reason),
            name: input?.name
          });
        }

        return result;
      },
      { targets: [], errors: [] }
    );

    response.status(body.errors.length > 0 ? 207 : 201).json(body);
  };

  deleteTarget: RequestHandler = (request, response) => {
    const targetId = paramString(request.params.targetId);
    if (!targetId) {
      response.status(400).json({ error: "Missing SSH target id" });
      return;
    }

    const deleted = this.sshTargetConfigService.deleteTarget(targetId);

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

  testTarget: RequestHandler = async (request, response) => {
    const targetId = paramString(request.params.targetId);
    if (!targetId) {
      response.status(400).json({ error: "Missing SSH target id" });
      return;
    }

    try {
      const result = await this.sshScanService.testTarget(targetId);
      response.json({ result });
    } catch (error) {
      if (error instanceof SshTargetNotFoundError) {
        response.status(404).json({ error: "SSH target not found" });
        return;
      }

      response.status(502).json({ error: "SSH test failed", message: errorMessage(error) });
    }
  };

  scanAllTargets: RequestHandler = async (_request, response) => {
    const result = await this.sshScanService.scanAllTargets();
    response.json(result);
  };
}
