import { useEffect, useState } from "react";
import {
	Check,
	Clipboard,
	LoaderCircle,
	Play,
	Terminal,
	X,
} from "lucide-react";
import type { QuickActionRunResponse } from "../../../../shared/types";
import type { QuickActionDefinition } from "../model/quickActions";

const outputText = (result: QuickActionRunResponse | null) => {
	if (!result) return "";

	return [
		result.stdout.trim(),
		result.stderr.trim() ? `stderr:\n${result.stderr.trim()}` : "",
	]
		.filter(Boolean)
		.join("\n\n");
};

const ranAtLabel = (value: string) => {
	const date = new Date(value);
	if (!Number.isFinite(date.getTime())) return "";

	return date.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
};

export function QuickActionPanel({
	action,
	error,
	isOpen,
	isRunning,
	onClose,
	onConfirm,
	result,
}: {
	action: QuickActionDefinition | null;
	error: string;
	isOpen: boolean;
	isRunning: boolean;
	onClose: () => void;
	onConfirm: () => void;
	result: QuickActionRunResponse | null;
}) {
	const [isCopied, setIsCopied] = useState(false);
	const output = outputText(result);
	const needsConfirmation =
		Boolean(action?.requiresConfirmation) && !isRunning && !result && !error;

	useEffect(() => {
		setIsCopied(false);
	}, [output]);

	const copyOutput = async () => {
		if (!output) return;

		try {
			await navigator.clipboard.writeText(output);
			setIsCopied(true);
		} catch {
			setIsCopied(false);
		}
	};

	if (!isOpen || !action) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
			<section className="flex max-h-[calc(100vh-2rem)] w-full max-w-180 flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
				<header className="flex items-start justify-between gap-3 border-b border-slate-200 px-4.5 py-4">
					<div className="min-w-0">
						<div className="flex items-center gap-2">
							<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
								<Terminal size={17} />
							</span>
							<div className="min-w-0">
								<h2 className="text-lg leading-tight font-extrabold text-slate-900">
									{action.label}
								</h2>
								<p className="mt-0.5 text-sm font-semibold text-slate-500">
									{action.description}
								</p>
							</div>
						</div>
					</div>
					<button
						type="button"
						className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
						onClick={onClose}
						disabled={isRunning}
						aria-label="Close quick action"
					>
						<X size={17} />
					</button>
				</header>

				<div className="min-h-0 overflow-y-auto p-4.5">
					<div className="rounded-lg border border-slate-200 bg-slate-950 p-3">
						<div className="mb-2 text-xs font-bold text-slate-400 uppercase">
							Command preview
						</div>
						<pre className="whitespace-pre-wrap wrap-break-word font-mono text-xs leading-5 text-slate-100">
							{action.commandPreview}
						</pre>
					</div>

					{needsConfirmation && (
						<div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
							This action runs on the selected target. Review the command before
							continuing.
						</div>
					)}

					{isRunning && (
						<div className="mt-3 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm font-bold text-blue-800">
							<LoaderCircle size={16} className="animate-spin" />
							Running action
						</div>
					)}

					{error && (
						<div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800">
							{error}
						</div>
					)}

					{result && (
						<div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
							<div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2.5">
								<div className="flex flex-wrap items-center gap-2">
									<span
										className={`inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-extrabold ${
											result.ok
												? "bg-emerald-100 text-emerald-700"
												: "bg-rose-100 text-rose-700"
										}`}
									>
										{result.ok ? "Succeeded" : "Failed"}
									</span>
									{result.exitCode !== undefined && (
										<span className="text-xs font-bold text-slate-500">
											Exit {result.exitCode}
										</span>
									)}
									<span className="text-xs font-bold text-slate-400">
										{ranAtLabel(result.ranAt)}
									</span>
								</div>
								<button
									type="button"
									className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
									onClick={copyOutput}
									disabled={!output}
								>
									{isCopied ? (
										<Check size={14} />
									) : (
										<Clipboard size={14} />
									)}
									{isCopied ? "Copied" : "Copy"}
								</button>
							</div>
							<pre className="max-h-90 overflow-auto bg-slate-950 p-3 font-mono text-xs leading-5 whitespace-pre-wrap wrap-break-word text-slate-100">
								{output || "No output returned"}
							</pre>
						</div>
					)}
				</div>

				<footer className="flex justify-end gap-2 border-t border-slate-200 px-4.5 py-3">
					<button
						type="button"
						className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
						onClick={onClose}
						disabled={isRunning}
					>
						{result || error ? "Close" : "Cancel"}
					</button>
					{needsConfirmation && (
						<button
							type="button"
							className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-900 bg-slate-900 px-3 text-sm font-bold text-white hover:bg-slate-700"
							onClick={onConfirm}
						>
							<Play size={15} />
							Run action
						</button>
					)}
				</footer>
			</section>
		</div>
	);
}
