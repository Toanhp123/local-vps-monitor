import {
	QuickActionButton,
	type QuickActionDefinition,
} from "@/features/quickActions";

export function ServerQuickActions({
	actions,
	onRunQuickAction,
}: {
	actions: QuickActionDefinition[];
	onRunQuickAction: (action: QuickActionDefinition) => void;
}) {
	if (actions.length === 0) return null;

	return (
		<div className="mt-4 border-t border-slate-200 pt-4">
			<div className="mb-2 text-xs font-bold text-slate-500 uppercase">
				Quick actions
			</div>
			<div className="flex flex-wrap gap-2">
				{actions.map((action) => (
					<QuickActionButton
						key={action.actionId}
						action={action}
						onRun={onRunQuickAction}
					/>
				))}
			</div>
		</div>
	);
}
