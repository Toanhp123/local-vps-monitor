import type { AppSnapshot, HealthStatus } from "../../../shared/types";

const composeProjectLabel = "com.docker.compose.project";
const composeServiceLabel = "com.docker.compose.service";

export interface DockerPsRow {
	ID?: string;
	Image?: string;
	Names?: string;
	Ports?: string;
	State?: string;
	Status?: string;
}

export interface DockerStatsRow {
	ID?: string;
	Container?: string;
	Name?: string;
	CPUPerc?: string;
	MemUsage?: string;
}

export interface DockerInspectRow {
	Id?: string;
	Name?: string;
	RestartCount?: number;
	Config?: {
		Labels?: Record<string, string> | null;
	};
	State?: {
		StartedAt?: string;
	};
}

export interface DockerInspectMetadata {
	composeProject?: string;
	composeService?: string;
	restartCount?: number;
	startedAt?: string;
}

const unitToBytes: Record<string, number> = {
	B: 1,
	KB: 1_000,
	MB: 1_000_000,
	GB: 1_000_000_000,
	TB: 1_000_000_000_000,
	KiB: 1024,
	MiB: 1024 ** 2,
	GiB: 1024 ** 3,
	TiB: 1024 ** 4,
};

const parseMemoryBytes = (value?: string) => {
	if (!value) return undefined;

	const firstValue = value.split("/")[0]?.trim();
	const match = firstValue?.match(/^([\d.]+)\s*([KMGT]?i?B)$/i);
	if (!match) return undefined;

	const amount = Number(match[1]);
	const unit = match[2];
	const multiplier = unitToBytes[unit] ?? unitToBytes[unit.toUpperCase()];

	if (!Number.isFinite(amount) || !multiplier) return undefined;
	return Math.round(amount * multiplier);
};

const parsePercent = (value?: string) => {
	if (!value) return undefined;

	const parsed = Number(value.replace("%", ""));
	return Number.isFinite(parsed) ? parsed : undefined;
};

const dockerHealth = (state?: string, status?: string): HealthStatus => {
	const normalizedState = state?.toLowerCase();
	const normalizedStatus = status?.toLowerCase() || "";

	if (normalizedStatus.includes("unhealthy")) return "warning";
	if (normalizedState === "running") return "healthy";
	if (["exited", "dead", "removing"].includes(normalizedState || ""))
		return "down";
	if (normalizedState) return "warning";

	return "unknown";
};

export const extractDockerContainerRefs = (containers: DockerPsRow[]) => {
	return containers
		.map((container) => container.ID)
		.filter((value): value is string =>
			Boolean(value && /^[a-f0-9]{12,64}$/i.test(value)),
		);
};

export const buildDockerInspectMetadata = (rows: DockerInspectRow[]) => {
	const metadata = new Map<string, DockerInspectMetadata>();

	for (const row of rows) {
		const labels = row.Config?.Labels || {};
		const entry: DockerInspectMetadata = {
			composeProject: labels[composeProjectLabel],
			composeService: labels[composeServiceLabel],
			restartCount:
				typeof row.RestartCount === "number"
					? row.RestartCount
					: undefined,
			startedAt: row.State?.StartedAt,
		};

		if (row.Id) {
			metadata.set(row.Id, entry);
			metadata.set(row.Id.slice(0, 12), entry);
		}

		if (row.Name) {
			metadata.set(row.Name.replace(/^\//, ""), entry);
		}
	}

	return metadata;
};

export const buildDockerApps = (
	containers: DockerPsRow[],
	statsRows: DockerStatsRow[],
	inspectMetadata: Map<string, DockerInspectMetadata>,
): AppSnapshot[] => {
	const stats = new Map<string, DockerStatsRow>();

	for (const row of statsRows) {
		if (row.ID) stats.set(row.ID, row);
		if (row.Container) stats.set(row.Container, row);
		if (row.Name) stats.set(row.Name, row);
	}

	return containers.map((row) => {
		const stat = stats.get(row.ID || "") || stats.get(row.Names || "");
		const metadata =
			inspectMetadata.get(row.ID || "") ||
			inspectMetadata.get(row.Names || "");
		const composeProject = metadata?.composeProject?.trim();

		return {
			id: `docker:${row.ID || row.Names}`,
			name:
				metadata?.composeService ||
				row.Names ||
				row.ID ||
				"unknown-container",
			kind: "docker",
			status: row.Status || row.State || "unknown",
			health: dockerHealth(row.State, row.Status),
			group: composeProject
				? {
						id: `docker-compose:${composeProject}`,
						name: composeProject,
						source: "docker-compose",
					}
				: undefined,
			cpuPercent: parsePercent(stat?.CPUPerc),
			memoryBytes: parseMemoryBytes(stat?.MemUsage),
			image: row.Image,
			ports: row.Ports,
			restarts: metadata?.restartCount,
			raw: {
				dockerId: row.ID,
				state: row.State,
				startedAt: metadata?.startedAt,
				composeProject: metadata?.composeProject,
				composeService: metadata?.composeService,
			},
		};
	});
};
