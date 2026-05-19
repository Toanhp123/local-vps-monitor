import { useState } from "react";
import type {
	ServerHistoricalMetricPoint,
	ServerMetricHistoryRange,
} from "@shared/types";
import { formatBytes } from "@/shared/lib/format";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";

type ChartMetricPoint = ServerHistoricalMetricPoint;

interface ChartSeries {
	color: string;
	fill: string;
	formatSummaryValue?: (value: number) => string;
	formatValue: (value: number, index?: number) => string;
	labels: string[];
	points: number[];
	subtitle: string;
	title: string;
	value: number;
}

interface ChartPoint {
	index: number;
	x: number;
	y: number;
	value: number;
}

interface HoverState {
	left: number;
	point: ChartPoint;
	top: number;
}

const rangeLabels: Record<ServerMetricHistoryRange, string> = {
	"1h": "1H",
	"24h": "24H",
	"7d": "7D",
	"30d": "30D",
};

const rangeOptions = (
	Object.entries(rangeLabels) as Array<[ServerMetricHistoryRange, string]>
).map(([value, label]) => ({
	label,
	value,
}));

const memoryPercent = (point: ChartMetricPoint) => {
	if (!point.memoryTotalBytes) return 0;
	return Math.round((point.memoryUsedBytes / point.memoryTotalBytes) * 100);
};

const hasDiskPercent = (
	point: ChartMetricPoint,
): point is ChartMetricPoint & {
	diskUsedPercent: number;
} => {
	return typeof point.diskUsedPercent === "number";
};

const hasCpuLoadPercent = (
	point: ChartMetricPoint,
): point is ServerHistoricalMetricPoint & {
	cpuCount: number;
	loadAverage1m: number;
} => {
	return (
		"cpuCount" in point &&
		"loadAverage1m" in point &&
		typeof point.cpuCount === "number" &&
		point.cpuCount > 0 &&
		typeof point.loadAverage1m === "number"
	);
};

const cpuLoadPercent = (
	point: ServerHistoricalMetricPoint & {
		cpuCount: number;
		loadAverage1m: number;
	},
) => {
	return Math.round((point.loadAverage1m / point.cpuCount) * 1000) / 10;
};

const chartPoints = (values: number[]) => {
	const width = 240;
	const height = 72;
	const padding = 8;
	if (values.length === 0) return [];

	const min = Math.min(...values);
	const max = Math.max(...values);
	const range = max - min;

	return values.map<ChartPoint>((value, index) => {
		const x =
			values.length === 1
				? width / 2
				: (index / (values.length - 1)) * width;
		const normalized = range === 0 ? 0.5 : (value - min) / range;
		const y = height - padding - normalized * (height - padding * 2);

		return { index, x, y, value };
	});
};

const pointsToString = (points: ChartPoint[]) => {
	return points
		.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
		.join(" ");
};

const areaPoints = (points: ChartPoint[]) => {
	if (points.length === 0) return "";
	return `0,72 ${pointsToString(points)} 240,72`;
};

const average = (values: number[]) => {
	if (values.length === 0) return 0;
	return values.reduce((total, value) => total + value, 0) / values.length;
};

const nearestPoint = (points: ChartPoint[], x: number) => {
	return points.reduce<ChartPoint | null>((nearest, point) => {
		if (!nearest) return point;
		return Math.abs(point.x - x) < Math.abs(nearest.x - x)
			? point
			: nearest;
	}, null);
};

const scanLabel = (value: string) => {
	const date = new Date(value);
	if (!Number.isFinite(date.getTime())) return "Scan";

	return date.toLocaleString([], {
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		month: "short",
	});
};

const tooltipPosition = (clientX: number, clientY: number) => {
	const margin = 12;
	const viewportWidth =
		typeof window === "undefined" ? 248 : window.innerWidth;
	const tooltipWidth = Math.min(
		224,
		Math.max(0, viewportWidth - margin * 2),
	);
	const halfTooltip = tooltipWidth / 2;
	const left = Math.min(
		viewportWidth - margin - halfTooltip,
		Math.max(margin + halfTooltip, clientX),
	);
	const top = clientY > 92 ? clientY - 74 : clientY + 18;

	return { left, top };
};

function MetricChartCard({ series }: { series: ChartSeries }) {
	const [hoverState, setHoverState] = useState<HoverState | null>(null);
	const hasEnoughData = series.points.length > 1;
	const points = chartPoints(series.points);
	const min = series.points.length > 0 ? Math.min(...series.points) : 0;
	const max = series.points.length > 0 ? Math.max(...series.points) : 0;
	const avg = average(series.points);
	const hoverPoint = hoverState?.point;

	return (
		<div className="min-h-44 rounded-lg border border-slate-200 bg-white p-3.5">
			<div className="flex items-start justify-between gap-3">
				<div>
					<span className="block text-xs font-bold text-slate-500 uppercase">
						{series.title}
					</span>
					<strong className="mt-1 block text-lg font-extrabold text-slate-900">
						{series.formatValue(series.value, series.points.length - 1)}
					</strong>
				</div>
				<span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">
					{series.subtitle}
				</span>
			</div>

			<div className="relative mt-3 h-24 rounded-lg bg-slate-50">
				{hasEnoughData ? (
					<>
						<svg
							viewBox="0 0 240 72"
							className="h-full w-full overflow-hidden rounded-lg"
							role="img"
							aria-label={`${series.title} trend`}
							preserveAspectRatio="none"
							onMouseLeave={() => setHoverState(null)}
							onMouseMove={(event) => {
								const rect = event.currentTarget.getBoundingClientRect();
								const x = ((event.clientX - rect.left) / rect.width) * 240;
								const point = nearestPoint(points, x);

								if (!point) {
									setHoverState(null);
									return;
								}

								setHoverState({
									point,
									...tooltipPosition(
										event.clientX,
										event.clientY,
									),
								});
							}}
						>
							<polygon points={areaPoints(points)} fill={series.fill} />
							<line
								x1="0"
								y1="18"
								x2="240"
								y2="18"
								stroke="currentColor"
								className="text-slate-200"
								strokeDasharray="4 4"
								strokeWidth="1"
							/>
							<line
								x1="0"
								y1="40"
								x2="240"
								y2="40"
								stroke="currentColor"
								className="text-slate-200"
								strokeDasharray="4 4"
								strokeWidth="1"
							/>
							<line
								x1="0"
								y1="64"
								x2="240"
								y2="64"
								stroke="currentColor"
								className="text-slate-200"
								strokeWidth="1"
							/>
							{hoverPoint && (
								<line
									x1={hoverPoint.x}
									y1="0"
									x2={hoverPoint.x}
									y2="72"
									stroke={series.color}
									strokeOpacity="0.32"
									strokeWidth="1"
									vectorEffect="non-scaling-stroke"
								/>
							)}
							<polyline
								points={pointsToString(points)}
								fill="none"
								stroke={series.color}
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="3"
								vectorEffect="non-scaling-stroke"
							/>
						</svg>
						{hoverPoint && (
							<span
								className="pointer-events-none absolute z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white shadow-sm"
								style={{
									borderColor: series.color,
									left: `${(hoverPoint.x / 240) * 100}%`,
									top: `${(hoverPoint.y / 72) * 100}%`,
								}}
							/>
						)}
						{hoverState && (
							<div
								className="pointer-events-none fixed z-50 min-w-32 max-w-[calc(100vw-1.5rem)] -translate-x-1/2 rounded-md border bg-white px-2.5 py-1.5 text-xs shadow-lg"
								style={{
									borderColor: series.color,
									left: hoverState.left,
									top: hoverState.top,
								}}
							>
								<strong className="block text-slate-900">
									{series.formatValue(
										hoverState.point.value,
										hoverState.point.index,
									)}
								</strong>
								<span className="text-slate-500">
									{series.labels[hoverState.point.index] ||
										`Scan ${hoverState.point.index + 1}`}
								</span>
							</div>
						)}
					</>
				) : (
					<div className="flex h-full flex-col items-center justify-center text-sm font-semibold text-slate-400">
						<span>{series.points.length} scan collected</span>
						<span className="mt-1 text-xs">Chart starts after 2 scans</span>
					</div>
				)}
			</div>

			<div className="mt-3 grid grid-cols-3 gap-2 text-xs">
				<div className="rounded-md bg-slate-50 px-2 py-1.5">
					<span className="block font-bold text-slate-400">Min</span>
					<strong className="text-slate-700">
						{(series.formatSummaryValue || series.formatValue)(min)}
					</strong>
				</div>
				<div className="rounded-md bg-slate-50 px-2 py-1.5">
					<span className="block font-bold text-slate-400">Avg</span>
					<strong className="text-slate-700">
						{(series.formatSummaryValue || series.formatValue)(avg)}
					</strong>
				</div>
				<div className="rounded-md bg-slate-50 px-2 py-1.5">
					<span className="block font-bold text-slate-400">Max</span>
					<strong className="text-slate-700">
						{(series.formatSummaryValue || series.formatValue)(max)}
					</strong>
				</div>
			</div>
		</div>
	);
}

export function ServerMetricCharts({
	error,
	history,
	isLoading,
	onRangeChange,
	range,
}: {
	error: string;
	history: ServerHistoricalMetricPoint[];
	isLoading: boolean;
	onRangeChange: (range: ServerMetricHistoryRange) => void;
	range: ServerMetricHistoryRange;
}) {
	const chartHistory: ChartMetricPoint[] = history;
	const hasHistory = chartHistory.length > 0;
	const latest = chartHistory.at(-1);
	const diskHistory = chartHistory.filter(hasDiskPercent);
	const loadHistory = chartHistory.filter(hasCpuLoadPercent);
	const latestMemory = latest ? memoryPercent(latest) : 0;
	const latestDisk = diskHistory.at(-1);
	const latestLoad = loadHistory.at(-1);
	const subtitle =
		chartHistory.length > 0
			? `${rangeLabels[range]} - ${chartHistory.length} points`
			: "No history";
	const series: ChartSeries[] = [
		{
			color: "#2563eb",
			fill: "rgba(37, 99, 235, 0.12)",
			formatValue: (value) => `${value.toFixed(1)}%`,
			labels: chartHistory.map((point) => scanLabel(point.observedAt)),
			points: chartHistory.map((point) => point.appCpuPercent),
			subtitle,
			title: "App CPU",
			value: latest?.appCpuPercent ?? 0,
		},
		{
			color: "#16a34a",
			fill: "rgba(22, 163, 74, 0.12)",
			formatSummaryValue: (value) => `${Math.round(value)}%`,
			formatValue: (value, index) => {
				const point =
					index === undefined ? latest : chartHistory[index];
				const memory = point ? ` (${formatBytes(point.memoryUsedBytes)})` : "";

				return `${Math.round(value)}%${memory}`;
			},
			labels: chartHistory.map((point) => scanLabel(point.observedAt)),
			points: chartHistory.map(memoryPercent),
			subtitle,
			title: "RAM Used",
			value: latestMemory,
		},
	];

	if (latestDisk) {
		series.push({
			color: "#dc2626",
			fill: "rgba(220, 38, 38, 0.12)",
			formatSummaryValue: (value) => `${Math.round(value)}%`,
			formatValue: (value, index) => {
				const point =
					index === undefined ? latestDisk : diskHistory[index];
				const disk =
					point?.diskUsedBytes !== undefined
						? ` (${formatBytes(point.diskUsedBytes)})`
						: "";

				return `${Math.round(value)}%${disk}`;
			},
			labels: diskHistory.map((point) => scanLabel(point.observedAt)),
			points: diskHistory.map((point) => point.diskUsedPercent),
			subtitle:
				diskHistory.length > 0
					? `${rangeLabels[range]} - ${diskHistory.length} points`
					: "No disk history",
			title: "Disk Used",
			value: latestDisk.diskUsedPercent,
		});
	}

	if (latestLoad) {
		series.push({
			color: "#7c3aed",
			fill: "rgba(124, 58, 237, 0.12)",
			formatSummaryValue: (value) => `${Math.round(value)}%`,
			formatValue: (value, index) => {
				const point =
					index === undefined ? latestLoad : loadHistory[index];
				const loadAverage =
					point?.loadAverage1m !== undefined
						? ` (${point.loadAverage1m.toFixed(2)} load)`
						: "";

				return `${Math.round(value)}%${loadAverage}`;
			},
			labels: loadHistory.map((point) => scanLabel(point.observedAt)),
			points: loadHistory.map(cpuLoadPercent),
			subtitle:
				loadHistory.length > 0
					? `${rangeLabels[range]} - ${loadHistory.length} points`
					: "No CPU load history",
			title: "CPU Load",
			value: cpuLoadPercent(latestLoad),
		});
	}

	return (
		<div className="border-t border-slate-200 bg-slate-50">
			<div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4.5 py-3.5 max-lg:flex-col max-lg:items-stretch">
				<div className="min-w-0">
					<h2 className="text-base leading-tight font-extrabold text-slate-900">
						Historical metrics
					</h2>
					<p className="mt-1 text-sm font-semibold text-slate-500">
						{hasHistory
							? `Loaded from database - ${chartHistory.length} points`
							: "No database metrics in this range"}
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-2 max-md:flex-col max-md:items-stretch">
					{isLoading && (
						<span className="text-xs font-extrabold text-slate-400 uppercase">
							Loading
						</span>
					)}
					<SegmentedControl
						ariaLabel="Metric history range"
						onChange={onRangeChange}
						options={rangeOptions}
						size="sm"
						tone="dark"
						value={range}
					/>
				</div>
			</div>
			{error && (
				<div className="border-b border-rose-100 bg-rose-50 px-4.5 py-3 text-sm font-bold text-rose-700">
					{error}
				</div>
			)}
			<div className="grid grid-cols-3 gap-3 p-3 max-xl:grid-cols-2 max-lg:grid-cols-1">
				{series.map((item) => (
					<MetricChartCard key={item.title} series={item} />
				))}
			</div>
		</div>
	);
}
