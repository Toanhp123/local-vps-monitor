import { RotateCcw, Terminal } from "lucide-react";
import type { QuickActionDefinition } from "../model/quickActions";

export function QuickActionButton({
	action,
	onRun,
}: {
	action: QuickActionDefinition;
	onRun: (action: QuickActionDefinition) => void;
}) {
	const Icon = action.actionId.endsWith(".restart") ? RotateCcw : Terminal;
	const toneClass =
		action.tone === "danger"
			? "hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
			: "hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700";

	return (
		<button
			type="button"
			className={`inline-flex min-h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 ${toneClass}`}
			onClick={() => onRun(action)}
			title={action.description}
		>
			<Icon size={14} />
			{action.label}
		</button>
	);
}
