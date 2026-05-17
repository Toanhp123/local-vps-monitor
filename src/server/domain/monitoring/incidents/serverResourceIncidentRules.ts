import type {
	IncidentEvent,
	IncidentKind,
	ServerAlertThresholds,
	ServerSnapshotPayload,
	StoredServer,
} from "../../../../shared/types";
import {
	cpuLoadPercent,
	cpuLoadState,
	diskLabel,
	diskUsageState,
	memoryUsageState,
	memoryUsedPercent,
	resourceIncidentSeverity,
	type ResourceUsageState,
} from "../policies/serverResourcePolicy";
import { createIncidentId } from "./incidentIds";

const formatBytes = (value: number) => {
	const units = ["B", "KB", "MB", "GB", "TB"];
	let amount = value;
	let unitIndex = 0;

	while (amount >= 1024 && unitIndex < units.length - 1) {
		amount /= 1024;
		unitIndex += 1;
	}

	return `${amount >= 10 ? amount.toFixed(0) : amount.toFixed(1)} ${units[unitIndex]}`;
};

const stateChanged = (
	currentState: ResourceUsageState,
	previousState: ResourceUsageState | undefined,
) => {
	if (currentState === previousState) return false;
	if (currentState === "healthy" && previousState === undefined) return false;

	return true;
};

const previousMessage = (previousValue: number | undefined) => {
	return previousValue === undefined
		? ""
		: ` Previous scan was ${previousValue.toFixed(1)}%.`;
};

const createPercentIncident = ({
	currentState,
	currentValue,
	kind,
	label,
	messageDetail,
	observedAt,
	payload,
	previousState,
	previousValue,
	scope,
}: {
	currentState: ResourceUsageState;
	currentValue: number;
	kind: IncidentKind;
	label: string;
	messageDetail: string;
	observedAt: Date;
	payload: ServerSnapshotPayload;
	previousState?: ResourceUsageState;
	previousValue?: number;
	scope: string;
}): IncidentEvent | null => {
	if (!stateChanged(currentState, previousState)) return null;

	if (currentState === "healthy") {
		return {
			id: createIncidentId(
				payload.serverId,
				kind,
				scope,
				observedAt,
				"resolved",
			),
			currentValue,
			kind,
			message: `${label} on ${payload.serverName} recovered to ${currentValue.toFixed(
				1,
			)}%.${previousMessage(previousValue)}`,
			occurredAt: observedAt.toISOString(),
			previousValue,
			serverId: payload.serverId,
			serverName: payload.serverName,
			severity: "resolved",
			title: `${label} recovered`,
		};
	}

	return {
		id: createIncidentId(
			payload.serverId,
			kind,
			scope,
			observedAt,
			currentState,
		),
		currentValue,
		kind,
		message: `${label} on ${payload.serverName} is ${currentValue.toFixed(
			1,
		)}%. ${messageDetail}${previousMessage(previousValue)}`,
		occurredAt: observedAt.toISOString(),
		previousValue,
		serverId: payload.serverId,
		serverName: payload.serverName,
		severity: resourceIncidentSeverity(currentState),
		title: `${label} is ${currentValue.toFixed(1)}%`,
	};
};

const createDiskUsageIncident = (
	payload: ServerSnapshotPayload,
	observedAt: Date,
	previousServer: StoredServer | undefined,
	thresholds?: ServerAlertThresholds,
): IncidentEvent | null => {
	const disk = payload.host.disk;
	if (!disk) return null;

	const previousDisk = previousServer?.host.disk;
	const currentState = diskUsageState(disk, thresholds) ?? "healthy";
	const previousState = diskUsageState(previousDisk, thresholds);

	return createPercentIncident({
		currentState,
		currentValue: disk.usedPercent,
		kind: "disk-usage",
		label: diskLabel(disk),
		messageDetail: `${formatBytes(disk.usedBytes)} used of ${formatBytes(
			disk.totalBytes,
		)}.`,
		observedAt,
		payload,
		previousState,
		previousValue: previousDisk?.usedPercent,
		scope: disk.mount,
	});
};

const createMemoryUsageIncident = (
	payload: ServerSnapshotPayload,
	observedAt: Date,
	previousServer: StoredServer | undefined,
	thresholds?: ServerAlertThresholds,
): IncidentEvent | null => {
	const currentValue = memoryUsedPercent(payload.host);
	if (currentValue === undefined) return null;

	const currentState = memoryUsageState(payload.host, thresholds) ?? "healthy";
	const previousState = memoryUsageState(previousServer?.host, thresholds);
	const usedBytes = Math.max(
		0,
		payload.host.memoryTotalBytes - payload.host.memoryFreeBytes,
	);

	return createPercentIncident({
		currentState,
		currentValue,
		kind: "memory-usage",
		label: "Memory",
		messageDetail: `${formatBytes(usedBytes)} used of ${formatBytes(
			payload.host.memoryTotalBytes,
		)}.`,
		observedAt,
		payload,
		previousState,
		previousValue: memoryUsedPercent(previousServer?.host),
		scope: "memory",
	});
};

const createCpuLoadIncident = (
	payload: ServerSnapshotPayload,
	observedAt: Date,
	previousServer: StoredServer | undefined,
	thresholds?: ServerAlertThresholds,
): IncidentEvent | null => {
	const currentValue = cpuLoadPercent(payload.host);
	if (currentValue === undefined) return null;

	const currentState = cpuLoadState(payload.host, thresholds) ?? "healthy";
	const previousState = cpuLoadState(previousServer?.host, thresholds);
	const loadAverage = payload.host.loadAverage[0];

	return createPercentIncident({
		currentState,
		currentValue,
		kind: "cpu-load",
		label: "CPU load",
		messageDetail: `1m load average is ${loadAverage.toFixed(
			2,
		)} across ${payload.host.cpuCount} cores.`,
		observedAt,
		payload,
		previousState,
		previousValue: cpuLoadPercent(previousServer?.host),
		scope: "cpu-load",
	});
};

export const createServerResourceIncidents = (
	payload: ServerSnapshotPayload,
	observedAt: Date,
	previousServer: StoredServer | undefined,
	thresholds?: ServerAlertThresholds,
) => {
	return [
		createDiskUsageIncident(payload, observedAt, previousServer, thresholds),
		createMemoryUsageIncident(payload, observedAt, previousServer, thresholds),
		createCpuLoadIncident(payload, observedAt, previousServer, thresholds),
	].filter((incident): incident is IncidentEvent => incident !== null);
};
