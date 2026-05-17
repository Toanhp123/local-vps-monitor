import type {
	AppPolicyOverrideInput,
	AppSnapshot,
	StoredServer,
} from "@shared/types";
import { ApplicationTable, groupApplications } from "@/entities/application";
import type { usePinnedItems } from "@/features/pinnedItems";
import type { QuickActionDefinition } from "@/features/quickActions";
import { ApplicationGroupCard } from "./ApplicationGroupCard";

export function ApplicationGroupsSection({
	activeAppPolicyKey,
	isSavingAppPolicy,
	onOpenAppLogs,
	onRunQuickAction,
	onUpdateAppPolicy,
	pinnedItems,
	server,
}: {
	activeAppPolicyKey: string | null;
	isSavingAppPolicy: boolean;
	onOpenAppLogs: (app: AppSnapshot) => void;
	onRunQuickAction: (action: QuickActionDefinition) => void;
	onUpdateAppPolicy: (input: AppPolicyOverrideInput) => Promise<boolean>;
	pinnedItems: ReturnType<typeof usePinnedItems>;
	server: StoredServer;
}) {
	const appGroups = pinnedItems.sortAppGroups(
		server.serverId,
		groupApplications(server.apps),
	);

	return (
		<div className="border-t border-slate-200">
			<div className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-2.5">
				<span className="text-xs font-bold text-slate-500 uppercase">
					Application groups on {server.serverName}
				</span>
			</div>
			{appGroups.length > 0 ? (
				<div className="grid gap-3 bg-slate-50 p-3">
					{appGroups.map((group) => (
						<ApplicationGroupCard
							key={group.id}
							activeAppPolicyKey={activeAppPolicyKey}
							group={group}
							isPinned={pinnedItems.isAppGroupPinned(
								server.serverId,
								group.id,
							)}
							isSavingAppPolicy={isSavingAppPolicy}
							onOpenAppLogs={onOpenAppLogs}
							onRunQuickAction={onRunQuickAction}
							onTogglePin={() =>
								pinnedItems.toggleAppGroupPin(
									server.serverId,
									group.id,
								)
							}
							onUpdateAppPolicy={onUpdateAppPolicy}
							server={server}
						/>
					))}
				</div>
			) : (
				<ApplicationTable apps={[]} />
			)}
		</div>
	);
}
