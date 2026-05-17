import { RotateCcw, Terminal } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import type { QuickActionDefinition } from "../model/quickActions";

export function QuickActionButton({
	action,
	onRun,
}: {
	action: QuickActionDefinition;
	onRun: (action: QuickActionDefinition) => void;
}) {
	const Icon = action.actionId.endsWith(".restart") ? RotateCcw : Terminal;

	return (
		<Button
			onClick={() => onRun(action)}
			icon={Icon}
			size="sm"
			title={action.description}
			variant={action.tone === "danger" ? "danger" : "secondary"}
		>
			{action.label}
		</Button>
	);
}
