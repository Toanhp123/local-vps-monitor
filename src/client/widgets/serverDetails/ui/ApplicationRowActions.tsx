import type {
	AppPolicyOverrideInput,
	AppSnapshot,
	StoredServer,
} from "@shared/types";
import { AppPolicyDialog } from "@/features/appPolicies";
import { OpenAppLogsButton } from "@/features/appLogs";
import {
	buildAppQuickActions,
	QuickActionMenu,
	type QuickActionDefinition,
} from "@/features/quickActions";

export function ApplicationRowActions({
	activeAppPolicyKey,
	app,
	isSavingAppPolicy,
	onOpenAppLogs,
	onRunQuickAction,
	onUpdateAppPolicy,
	server,
}: {
	activeAppPolicyKey: string | null;
	app: AppSnapshot;
	isSavingAppPolicy: boolean;
	onOpenAppLogs: (app: AppSnapshot) => void;
	onRunQuickAction: (action: QuickActionDefinition) => void;
	onUpdateAppPolicy: (input: AppPolicyOverrideInput) => Promise<boolean>;
	server: StoredServer;
}) {
	const appQuickActions = buildAppQuickActions(server, app);

	return (
		<div className="flex justify-end gap-1.5">
			<AppPolicyDialog
				app={app}
				isSaving={
					isSavingAppPolicy &&
					activeAppPolicyKey === `${server.serverId}:${app.id}`
				}
				onSave={onUpdateAppPolicy}
				serverId={server.serverId}
			/>
			<OpenAppLogsButton onOpen={() => onOpenAppLogs(app)} />
			<QuickActionMenu
				actions={appQuickActions}
				onRun={onRunQuickAction}
			/>
		</div>
	);
}
