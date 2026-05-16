import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
	Check,
	Clipboard,
	LoaderCircle,
	Pause,
	Play,
	RefreshCw,
	Search,
	X,
} from "lucide-react";
import type { AppLogsResponse, AppSnapshot } from "../../../../shared/types";
import { appDisplayName } from "../../../entities/application/model/appMonitoringPolicy";
import { RuntimeBadge } from "../../../entities/application/ui/RuntimeBadge";
import { SelectField } from "../../../shared/ui/SelectField";

const fetchedAtLabel = (value?: string) => {
	if (!value) return "";

	const date = new Date(value);
	if (!Number.isFinite(date.getTime())) return "";

	return date.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
};

const errorPattern =
	/\b(error|exception|fatal|panic|traceback|failed|failure|unhandled)\b/i;
const warningPattern = /\b(warn|warning|deprecated|retry|timeout)\b/i;

const dockerTimestampPattern =
	/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?Z\s+(.*)$/;
const duplicateTimePattern = /^\d{2}:\d{2}:\d{2}(?:\.\d+)?\s+/;
const lineCountOptions = [100, 200, 300, 500, 1000].map((value) => ({
	label: `${value} lines`,
	value: String(value),
}));

const formatLogTimestamp = (value: string) => {
	const date = new Date(value);
	if (!Number.isFinite(date.getTime())) return "";

	return new Intl.DateTimeFormat(undefined, {
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		month: "short",
		second: "2-digit",
	}).format(date);
};

const normalizeDockerTimestamp = (base: string, fraction = "") => {
	if (!fraction) return `${base}Z`;

	return `${base}.${fraction.slice(0, 3).padEnd(3, "0")}Z`;
};

const parseLogLine = (line: string, index: number) => {
	const match = line.match(dockerTimestampPattern);

	if (!match) {
		return {
			line,
			message: line,
			number: index + 1,
			timestamp: "",
		};
	}

	const timestamp = normalizeDockerTimestamp(match[1], match[2]);
	const message = match[3].replace(duplicateTimePattern, "");

	return {
		line,
		message,
		number: index + 1,
		timestamp: formatLogTimestamp(timestamp),
	};
};

const lineClass = (line: string) => {
	if (errorPattern.test(line)) {
		return "border-rose-500/50 bg-rose-950/45 text-rose-50";
	}

	if (warningPattern.test(line)) {
		return "border-amber-400/50 bg-amber-950/35 text-amber-50";
	}

	return "border-transparent text-slate-100 hover:bg-slate-900/70";
};

const splitHighlightedText = (line: string, query: string): ReactNode[] => {
	if (!query) return [line];

	const loweredLine = line.toLowerCase();
	const loweredQuery = query.toLowerCase();
	const parts: ReactNode[] = [];
	let index = 0;
	let matchIndex = loweredLine.indexOf(loweredQuery);

	while (matchIndex !== -1) {
		if (matchIndex > index) {
			parts.push(line.slice(index, matchIndex));
		}

		const endIndex = matchIndex + query.length;
		parts.push(
			<mark
				key={`${matchIndex}-${endIndex}`}
				className="rounded bg-yellow-300 px-0.5 text-slate-950"
			>
				{line.slice(matchIndex, endIndex)}
			</mark>,
		);

		index = endIndex;
		matchIndex = loweredLine.indexOf(loweredQuery, index);
	}

	if (index < line.length) {
		parts.push(line.slice(index));
	}

	return parts;
};

export function AppLogsPanel({
	app,
	error,
	isLoading,
	isOpen,
	lineCount,
	logs,
	onClose,
	onLineCountChange,
	onRefresh,
}: {
	app: AppSnapshot | null;
	error: string;
	isLoading: boolean;
	isOpen: boolean;
	lineCount: number;
	logs: AppLogsResponse | null;
	onClose: () => void;
	onLineCountChange: (lineCount: number) => void;
	onRefresh: () => void;
}) {
	const [copyState, setCopyState] = useState<"copied" | "failed" | "idle">(
		"idle",
	);
	const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
	const [query, setQuery] = useState("");
	const scrollRef = useRef<HTMLDivElement | null>(null);
	const searchQuery = query.trim();
	const logLines = useMemo(
		() => (logs?.content ? logs.content.split(/\r?\n/) : []),
		[logs?.content],
	);
	const logLineEntries = useMemo(
		() => logLines.map((line, index) => parseLogLine(line, index)),
		[logLines],
	);
	const visibleLineEntries = useMemo(() => {
		if (!searchQuery) return logLineEntries;

		const loweredQuery = searchQuery.toLowerCase();
		return logLineEntries.filter((entry) =>
			entry.line.toLowerCase().includes(loweredQuery),
		);
	}, [logLineEntries, searchQuery]);
	const visibleContent = visibleLineEntries
		.map((entry) => entry.line)
		.join("\n");

	useEffect(() => {
		setCopyState("idle");
	}, [logs?.content, searchQuery]);

	useEffect(() => {
		if (!isAutoScrollEnabled || !scrollRef.current) return;

		scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
	}, [isAutoScrollEnabled, logs?.content, searchQuery]);

	const copyVisibleLogs = async () => {
		if (!visibleContent) return;

		try {
			await navigator.clipboard.writeText(visibleContent);
			setCopyState("copied");
		} catch {
			setCopyState("failed");
		}
	};

	if (!isOpen || !app) return null;

	return (
		<div className="fixed inset-0 z-50 overscroll-none bg-slate-950/35">
			<section className="ml-auto flex h-full w-[min(1080px,100vw)] overscroll-none flex-col bg-white shadow-2xl">
				<header className="flex items-start justify-between gap-3 border-b border-slate-200 px-4.5 py-4 max-lg:flex-col">
					<div className="min-w-0">
						<div className="flex min-w-0 flex-wrap items-center gap-2">
							<h2 className="max-w-150 overflow-hidden text-ellipsis text-lg leading-tight font-extrabold text-slate-900">
								{appDisplayName(app)}
							</h2>
							<RuntimeBadge kind={app.kind} />
						</div>
						<div className="mt-1 flex flex-wrap gap-1.5 text-xs font-bold text-slate-500">
							<span>{logs ? `${logs.lines} lines` : "Logs"}</span>
							{searchQuery && logs?.content && (
								<span>
									{visibleLineEntries.length} matching lines
								</span>
							)}
							{logs?.fetchedAt && (
								<span>
									Fetched {fetchedAtLabel(logs.fetchedAt)}
								</span>
							)}
						</div>
					</div>

					<div className="flex flex-wrap items-center justify-end gap-2 max-lg:w-full max-lg:justify-start">
						<label className="flex h-9 min-w-60 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-slate-500">
							<Search size={15} />
							<input
								className="w-full min-w-0 border-0 text-sm font-semibold text-slate-900 outline-0"
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Search logs"
							/>
							{query && (
								<button
									type="button"
									className="cursor-pointer text-slate-400 hover:text-slate-700"
									onClick={() => setQuery("")}
									aria-label="Clear log search"
								>
									<X size={14} />
								</button>
							)}
						</label>
						<SelectField
							ariaLabel="Log line count"
							buttonClassName="inline-flex min-h-9 min-w-28 cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-left text-sm font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
							disabled={isLoading}
							onChange={(value) => onLineCountChange(Number(value))}
							options={lineCountOptions}
							value={String(lineCount)}
						/>
						<button
							type="button"
							className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
							onClick={() =>
								setIsAutoScrollEnabled((current) => !current)
							}
						>
							{isAutoScrollEnabled ? (
								<Pause size={15} />
							) : (
								<Play size={15} />
							)}
							{isAutoScrollEnabled ? "Pause" : "Auto"}
						</button>
						<button
							type="button"
							className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
							onClick={copyVisibleLogs}
							disabled={!visibleContent}
						>
							{copyState === "copied" ? (
								<Check size={15} />
							) : (
								<Clipboard size={15} />
							)}
							{copyState === "failed"
								? "Copy failed"
								: copyState === "copied"
									? "Copied"
									: searchQuery
										? "Copy matches"
										: "Copy logs"}
						</button>
						<button
							type="button"
							className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
							onClick={onRefresh}
							disabled={isLoading}
						>
							{isLoading ? (
								<LoaderCircle
									size={15}
									className="animate-spin"
								/>
							) : (
								<RefreshCw size={15} />
							)}
							Refresh
						</button>
						<button
							type="button"
							className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
							onClick={onClose}
							aria-label="Close logs"
						>
							<X size={16} />
						</button>
					</div>
				</header>

				<div className="min-h-0 flex-1 overscroll-contain bg-slate-950 p-4">
					{isLoading && !logs ? (
						<div className="flex h-full items-center justify-center gap-2 text-sm font-bold text-slate-300">
							<LoaderCircle size={16} className="animate-spin" />
							Loading logs
						</div>
					) : error ? (
						<div className="rounded-lg border border-rose-500/40 bg-rose-950/50 p-3 text-sm font-bold text-rose-100">
							{error}
						</div>
					) : logs?.content ? (
						<div
							ref={scrollRef}
							className="h-full overflow-auto overscroll-contain rounded-lg bg-slate-950 font-mono text-xs leading-5"
						>
							{visibleLineEntries.length > 0 ? (
								<ol className="min-w-full">
									{visibleLineEntries.map((entry) => (
										<li
											key={entry.number}
											className={`grid grid-cols-[4.5rem_9.5rem_minmax(0,1fr)] border-l-2 px-2 py-1 ${lineClass(entry.message)}`}
										>
											<span className="select-none pr-4 text-right text-slate-500">
												{entry.number}
											</span>
											<span
												className="select-none pr-4 text-slate-500"
												title={entry.line}
											>
												{entry.timestamp || "-"}
											</span>
											<span className="whitespace-pre-wrap wrap-break-word">
												{splitHighlightedText(
													entry.message,
													searchQuery,
												)}
											</span>
										</li>
									))}
								</ol>
							) : (
								<div className="flex h-full items-center justify-center text-sm font-bold text-slate-400">
									No lines match search
								</div>
							)}
						</div>
					) : (
						<div className="flex h-full items-center justify-center text-sm font-bold text-slate-400">
							No logs returned
						</div>
					)}
				</div>
			</section>
		</div>
	);
}
