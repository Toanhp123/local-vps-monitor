import { useState } from "react";
import type { ServerMetricPoint, StoredServer } from "../../../../shared/types";
import { formatBytes } from "../../../shared/lib/format";

const chartWindow = 24;

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

const memoryPercent = (point: ServerMetricPoint) => {
	if (!point.memoryTotalBytes) return 0;
	return Math.round((point.memoryUsedBytes / point.memoryTotalBytes) * 100);
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

	return date.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
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
							{hoverPoint && (
								<circle
									cx={hoverPoint.x}
									cy={hoverPoint.y}
									r="3"
									fill="white"
									stroke={series.color}
									strokeWidth="2"
									vectorEffect="non-scaling-stroke"
								/>
							)}
						</svg>
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

export function ServerMetricCharts({ server }: { server: StoredServer }) {
	const history = server.metricsHistory.slice(-chartWindow);
	const latest = history.at(-1);
	const latestMemory = latest ? memoryPercent(latest) : 0;
	const subtitle =
		history.length > 0 ? `Last ${history.length} scans` : "No history";
	const series: ChartSeries[] = [
		{
			color: "#2563eb",
			fill: "rgba(37, 99, 235, 0.12)",
			formatValue: (value) => `${value.toFixed(1)}%`,
			labels: history.map((point) => scanLabel(point.observedAt)),
			points: history.map((point) => point.appCpuPercent),
			subtitle,
			title: "App CPU",
			value: latest?.appCpuPercent ?? 0,
		},
		{
			color: "#16a34a",
			fill: "rgba(22, 163, 74, 0.12)",
			formatSummaryValue: (value) => `${Math.round(value)}%`,
			formatValue: (value, index) => {
				const point = index === undefined ? latest : history[index];
				const memory = point ? ` (${formatBytes(point.memoryUsedBytes)})` : "";

				return `${Math.round(value)}%${memory}`;
			},
			labels: history.map((point) => scanLabel(point.observedAt)),
			points: history.map(memoryPercent),
			subtitle,
			title: "RAM Used",
			value: latestMemory,
		},
	];

	return (
		<div className="grid grid-cols-2 gap-3 border-t border-slate-200 bg-slate-50 p-3 max-lg:grid-cols-1">
			{series.map((item) => (
				<MetricChartCard key={item.title} series={item} />
			))}
		</div>
	);
}
