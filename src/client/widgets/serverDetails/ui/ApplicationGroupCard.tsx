import { Box, SquareTerminal } from "lucide-react";
import type {
	AppPolicyOverrideInput,
	AppSnapshot,
	StoredServer,
} from "@shared/types";
import {
	appGroupSourceLabels,
	ApplicationTable,
	monitoredApps,
	type ApplicationGroupView,
} from "@/entities/application";
import { PinToggleButton } from "@/features/pinnedItems";
import type { QuickActionDefinition } from "@/features/quickActions";
import { Badge } from "@/shared/ui/Badge";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { ApplicationRowActions } from "./ApplicationRowActions";

export function ApplicationGroupCard({
	activeAppPolicyKey,
	group,
	isPinned,
	isSavingAppPolicy,
	onOpenAppLogs,
	onRunQuickAction,
	onTogglePin,
	onUpdateAppPolicy,
	server,
}: {
	activeAppPolicyKey: string | null;
	group: ApplicationGroupView;
	isPinned: boolean;
	isSavingAppPolicy: boolean;
	onOpenAppLogs: (app: AppSnapshot) => void;
	onRunQuickAction: (action: QuickActionDefinition) => void;
	onTogglePin: () => void;
	onUpdateAppPolicy: (input: AppPolicyOverrideInput) => Promise<boolean>;
	server: StoredServer;
}) {
	const GroupIcon = group.source === "pm2" ? SquareTerminal : Box;

	return (
		<div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
			<div className="flex items-center justify-between gap-3 border-b border-slate-200 px-3.5 py-3 max-md:flex-col max-md:items-stretch">
				<div className="flex min-w-0 items-center gap-2.5">
					<PinToggleButton
						ariaLabel={
							isPinned
								? `Unpin ${group.name}`
								: `Pin ${group.name}`
						}
						isPinned={isPinned}
						onToggle={onTogglePin}
					/>
					<span className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
						<GroupIcon size={17} />
					</span>
					<div className="min-w-0">
						<strong className="block max-w-100 overflow-hidden text-ellipsis text-slate-900">
							{group.name}
						</strong>
						<span className="mt-0.5 block text-xs font-bold text-slate-500 uppercase">
							{appGroupSourceLabels[group.source]}
						</span>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-1.5">
					<StatusBadge status={group.status} />
					<Badge size="md">
						{monitoredApps(group.apps).length}/{group.apps.length}{" "}
						apps
					</Badge>
					{group.dockerCount > 0 && (
						<Badge icon={Box} size="md" tone="blue">
							{group.dockerCount}
						</Badge>
					)}
					{group.pm2Count > 0 && (
						<Badge icon={SquareTerminal} size="md" tone="emerald">
							{group.pm2Count}
						</Badge>
					)}
				</div>
			</div>

			<ApplicationTable
				actions={(app) => (
					<ApplicationRowActions
						activeAppPolicyKey={activeAppPolicyKey}
						app={app}
						isSavingAppPolicy={isSavingAppPolicy}
						onOpenAppLogs={onOpenAppLogs}
						onRunQuickAction={onRunQuickAction}
						onUpdateAppPolicy={onUpdateAppPolicy}
						server={server}
					/>
				)}
				apps={group.apps}
			/>
		</div>
	);
}
