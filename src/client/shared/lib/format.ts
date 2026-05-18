export const formatBytes = (value?: number) => {
	if (value === undefined) return "-";

	const units = ["B", "KB", "MB", "GB", "TB"];
	let amount = value;
	let unitIndex = 0;

	while (amount >= 1024 && unitIndex < units.length - 1) {
		amount /= 1024;
		unitIndex += 1;
	}

	return `${amount >= 10 ? amount.toFixed(0) : amount.toFixed(1)} ${units[unitIndex]}`;
};

export const formatDuration = (seconds?: number) => {
	if (seconds === undefined) return "-";

	const days = Math.floor(seconds / 86_400);
	const hours = Math.floor((seconds % 86_400) / 3_600);
	const minutes = Math.floor((seconds % 3_600) / 60);

	if (days > 0) return `${days}d ${hours}h`;
	if (hours > 0) return `${hours}h ${minutes}m`;
	return `${minutes}m`;
};

export const relativeTime = (value: string, now = Date.now()) => {
	const diffMs = now - new Date(value).getTime();
	if (!Number.isFinite(diffMs)) return "-";

	const seconds = Math.max(0, Math.round(diffMs / 1000));
	if (seconds < 60) return `${seconds}s ago`;

	const minutes = Math.round(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;

	const hours = Math.round(minutes / 60);
	if (hours < 48) return `${hours}h ago`;

	return `${Math.round(hours / 24)}d ago`;
};

export const summaryMonitoredApps = (
	summary: { monitoredApps?: number; totalApps?: number } | undefined,
) => {
	return summary?.monitoredApps ?? summary?.totalApps ?? 0;
};
