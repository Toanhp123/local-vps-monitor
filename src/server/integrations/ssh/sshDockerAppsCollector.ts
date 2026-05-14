import type { Client } from "ssh2";
import type { AppSnapshot } from "../../../shared/types";
import {
  buildDockerApps,
  buildDockerInspectMetadata,
  extractDockerContainerRefs,
  type DockerInspectMetadata,
  type DockerInspectRow,
  type DockerPsRow,
  type DockerStatsRow,
} from "../docker/dockerAppsParser";
import { safeRunSshCommand } from "./sshCommandRunner";
import { parseJsonLines } from "./sshOutputParsers";

const collectDockerInspectMetadata = async (
  client: Client,
  containers: DockerPsRow[],
  timeoutMs: number,
) => {
  const containerRefs = extractDockerContainerRefs(containers);
  const metadata = new Map<string, DockerInspectMetadata>();
  if (containerRefs.length === 0) return metadata;

  const inspectResult = await safeRunSshCommand(
    client,
    `docker inspect --format '{{json .}}' ${containerRefs.join(" ")}`,
    timeoutMs,
  );
  if (!inspectResult.ok || !inspectResult.stdout.trim()) return metadata;

  return buildDockerInspectMetadata(
    parseJsonLines<DockerInspectRow>(inspectResult.stdout),
  );
};

export const collectSshDockerApps = async (
  client: Client,
  timeoutMs: number,
): Promise<AppSnapshot[]> => {
  const psResult = await safeRunSshCommand(
    client,
    "command -v docker >/dev/null 2>&1 && docker ps -a --format '{{json .}}' || true",
    timeoutMs,
  );
  if (!psResult.stdout.trim()) return [];

  const containers = parseJsonLines<DockerPsRow>(psResult.stdout);
  const [statsResult, inspectMetadata] = await Promise.all([
    safeRunSshCommand(
      client,
      "command -v docker >/dev/null 2>&1 && docker stats --no-stream --format '{{json .}}' || true",
      timeoutMs,
    ),
    collectDockerInspectMetadata(client, containers, timeoutMs),
  ]);
  const stats = statsResult.ok
    ? parseJsonLines<DockerStatsRow>(statsResult.stdout)
    : [];

  return buildDockerApps(containers, stats, inspectMetadata);
};
