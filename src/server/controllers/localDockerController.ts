import type { RequestHandler } from "express";
import { errorMessage } from "../lib/errorMessage";
import type { LocalDockerScanService } from "../services/localDockerScanService";

export class LocalDockerController {
  constructor(private readonly localDockerScanService: LocalDockerScanService) {}

  scanLocalDocker: RequestHandler = async (_request, response) => {
    try {
      const result = await this.localDockerScanService.scanLocalDocker();
      response.json({ result });
    } catch (error) {
      response.status(502).json({
        error: "Local Docker scan failed",
        message: errorMessage(error)
      });
    }
  };
}
