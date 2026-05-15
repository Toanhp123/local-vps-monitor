import type { DiskMetrics } from "../../../shared/types";

const bytesPerKib = 1024;

const parseNumber = (value: string | undefined) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
};

const roundPercent = (usedBytes: number, totalBytes: number) => {
	if (totalBytes <= 0) return 0;

	return Math.round((usedBytes / totalBytes) * 1000) / 10;
};

const createDiskMetrics = ({
	availableBytes,
	filesystem,
	mount,
	totalBytes,
	usedBytes,
}: Omit<DiskMetrics, "usedPercent">): DiskMetrics | undefined => {
	if (totalBytes <= 0) return undefined;

	return {
		availableBytes: Math.max(0, availableBytes),
		filesystem,
		mount,
		totalBytes,
		usedBytes: Math.max(0, usedBytes),
		usedPercent: roundPercent(usedBytes, totalBytes),
	};
};

export const parseDfRootDisk = (raw: string): DiskMetrics | undefined => {
	const lines = raw
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);
	const row = lines.at(-1);
	if (!row) return undefined;

	const columns = row.split(/\s+/);
	if (columns.length < 6) return undefined;

	const totalBlocks = parseNumber(columns[1]);
	const usedBlocks = parseNumber(columns[2]);
	const availableBlocks = parseNumber(columns[3]);
	if (
		totalBlocks === undefined ||
		usedBlocks === undefined ||
		availableBlocks === undefined
	) {
		return undefined;
	}

	return createDiskMetrics({
		availableBytes: availableBlocks * bytesPerKib,
		filesystem: columns[0] || "unknown",
		mount: columns.slice(5).join(" ") || "/",
		totalBytes: totalBlocks * bytesPerKib,
		usedBytes: usedBlocks * bytesPerKib,
	});
};

export const parseWindowsLogicalDisk = (
	raw: string,
	fallbackMount: string,
): DiskMetrics | undefined => {
	const line = raw
		.split(/\r?\n/)
		.map((item) => item.trim())
		.find(Boolean);
	if (!line) return undefined;

	const [deviceId, sizeRaw, freeRaw] = line.split(/\s+/);
	const totalBytes = parseNumber(sizeRaw);
	const availableBytes = parseNumber(freeRaw);
	if (totalBytes === undefined || availableBytes === undefined) {
		return undefined;
	}

	const mount = deviceId || fallbackMount;

	return createDiskMetrics({
		availableBytes,
		filesystem: mount,
		mount,
		totalBytes,
		usedBytes: totalBytes - availableBytes,
	});
};
