import type {
	IncidentEvent,
	ServerSnapshotPayload,
	StoredServer,
} from "../../../../shared/types";
import {
	diskIncidentSeverity,
	diskLabel,
	diskUsageState,
} from "../policies/diskUsagePolicy";
import { createIncidentId } from "./incidentIds";

const formatDiskBytes = (value: number) => {
	const units = ["B", "KB", "MB", "GB", "TB"];
	let amount = value;
	let unitIndex = 0;

	while (amount >= 1024 && unitIndex < units.length - 1) {
		amount /= 1024;
		unitIndex += 1;
	}

	return `${amount >= 10 ? amount.toFixed(0) : amount.toFixed(1)} ${units[unitIndex]}`;
};

export const createDiskUsageIncident = (
	payload: ServerSnapshotPayload,
	observedAt: Date,
	previousServer: StoredServer | undefined,
): IncidentEvent | null => {
	const disk = payload.host.disk;
	if (!disk) return null;

	const previousDisk = previousServer?.host.disk;
	const currentState = diskUsageState(disk) ?? "healthy";
	const previousState = diskUsageState(previousDisk);
	if (currentState === previousState) return null;
	if (currentState === "healthy" && previousState === undefined) return null;

	const currentValue = disk.usedPercent;
	const previousValue = previousDisk?.usedPercent;
	const messageSuffix =
		previousValue === undefined
			? ""
			: ` Previous scan was ${previousValue.toFixed(1)}%.`;

	if (currentState === "healthy") {
		return {
			id: createIncidentId(
				payload.serverId,
				"disk-usage",
				disk.mount,
				observedAt,
				"resolved",
			),
			currentValue,
			kind: "disk-usage",
			message: `${diskLabel(disk)} on ${payload.serverName} recovered to ${currentValue.toFixed(
				1,
			)}% used.${messageSuffix}`,
			occurredAt: observedAt.toISOString(),
			previousValue,
			serverId: payload.serverId,
			serverName: payload.serverName,
			severity: "resolved",
			title: `${diskLabel(disk)} recovered`,
		};
	}

	return {
		id: createIncidentId(
			payload.serverId,
			"disk-usage",
			disk.mount,
			observedAt,
			currentState,
		),
		currentValue,
		kind: "disk-usage",
		message: `${diskLabel(disk)} on ${payload.serverName} is ${currentValue.toFixed(
			1,
		)}% full (${formatDiskBytes(disk.usedBytes)} used of ${formatDiskBytes(
			disk.totalBytes,
		)}).${messageSuffix}`,
		occurredAt: observedAt.toISOString(),
		previousValue,
		serverId: payload.serverId,
		serverName: payload.serverName,
		severity: diskIncidentSeverity(currentState),
		title: `${diskLabel(disk)} is ${currentValue.toFixed(1)}% full`,
	};
};
