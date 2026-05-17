import type {
	AppPolicyOverrideInput,
	AppSnapshot,
	StoredServer,
} from "@shared/types";
import { ServerMetricCharts } from "@/entities/server";
import { ServerMetricsGrid } from "@/entities/server";
import type { usePinnedItems } from "@/features/pinnedItems";
import type { QuickActionDefinition } from "@/features/quickActions";
import { ApplicationGroupsSection } from "./ApplicationGroupsSection";
import { ServerDetailsHeader } from "./ServerDetailsHeader";

export function ServerDetailsView({
	activeAppPolicyKey,
	isScanDisabled,
	isSavingAppPolicy,
	isScanning,
	now,
	onBack,
	onOpenAppLogs,
	onRunQuickAction,
	onUpdateAppPolicy,
	onScan,
	pinnedItems,
	server,
}: {
	activeAppPolicyKey: string | null;
	isScanDisabled: boolean;
	isSavingAppPolicy: boolean;
	isScanning: boolean;
	now: number;
	onBack: () => void;
	onOpenAppLogs: (app: AppSnapshot) => void;
	onRunQuickAction: (action: QuickActionDefinition) => void;
	onUpdateAppPolicy: (input: AppPolicyOverrideInput) => Promise<boolean>;
	onScan: () => void;
	pinnedItems: ReturnType<typeof usePinnedItems>;
	server: StoredServer;
}) {
	return (
		<section className="grid gap-4">
			<ServerDetailsHeader
				isScanDisabled={isScanDisabled}
				isScanning={isScanning}
				now={now}
				onBack={onBack}
				onRunQuickAction={onRunQuickAction}
				onScan={onScan}
				server={server}
			/>

			<div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
				<ServerMetricsGrid server={server} />
				<ServerMetricCharts server={server} />

				<ApplicationGroupsSection
					activeAppPolicyKey={activeAppPolicyKey}
					isSavingAppPolicy={isSavingAppPolicy}
					onOpenAppLogs={onOpenAppLogs}
					onRunQuickAction={onRunQuickAction}
					onUpdateAppPolicy={onUpdateAppPolicy}
					pinnedItems={pinnedItems}
					server={server}
				/>
			</div>
		</section>
	);
}
