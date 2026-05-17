import { useEffect, useMemo, useState, type FormEvent } from "react";
import { HardDrive, Server } from "lucide-react";
import type {
	ServerAlertPolicy,
	ServerAlertPolicyUpdateInput,
	ServerAlertThresholds,
	StoredServer,
} from "@shared/types";
import { Badge } from "@/shared/ui/Badge";
import { SettingsPanelFrame } from "@/shared/ui/SettingsPanelFrame";
import {
	emptyThresholdForm,
	normalizeServerAlertPolicyForCompare,
	parseThresholdForm,
	serverAlertResources,
	thresholdFormFromValues,
	validateThresholds,
	type ThresholdFormState,
} from "../model/serverAlertPolicyForm";
import { ServerAlertOverrideRow } from "./ServerAlertOverrideRow";
import { ServerAlertThresholdGroup } from "./ServerAlertThresholdGroup";

export function ServerAlertPolicyPanel({
	error,
	isLoading,
	isSaving,
	onSavePolicy,
	policy,
	servers,
}: {
	error: string;
	isLoading: boolean;
	isSaving: boolean;
	onSavePolicy: (input: ServerAlertPolicyUpdateInput) => Promise<boolean>;
	policy: ServerAlertPolicy | null;
	servers: StoredServer[];
}) {
	const [defaultThresholds, setDefaultThresholds] =
		useState<ThresholdFormState>(() => emptyThresholdForm());
	const [customServerIds, setCustomServerIds] = useState<Set<string>>(
		() => new Set(),
	);
	const [serverThresholds, setServerThresholds] = useState<
		Record<string, ThresholdFormState>
	>({});

	useEffect(() => {
		if (!policy) return;

		setDefaultThresholds(thresholdFormFromValues(policy.defaults));
		setCustomServerIds(new Set(Object.keys(policy.serverOverrides)));
		setServerThresholds(
			Object.fromEntries(
				Object.entries(policy.serverOverrides).map(
					([serverId, thresholds]) => [
						serverId,
						thresholdFormFromValues(thresholds),
					],
				),
			),
		);
	}, [policy]);

	const draftPolicy = useMemo<ServerAlertPolicy | null>(() => {
		if (!policy) return null;

		const defaults = parseThresholdForm(defaultThresholds);
		const serverOverrides: Record<string, ServerAlertThresholds> = {};

		for (const serverId of customServerIds) {
			const form = serverThresholds[serverId];
			serverOverrides[serverId] = parseThresholdForm(
				form ?? defaultThresholds,
			);
		}

		return { defaults, serverOverrides };
	}, [customServerIds, defaultThresholds, policy, serverThresholds]);

	const validationError = useMemo(() => {
		if (!draftPolicy) return "";

		const defaultError = validateThresholds(draftPolicy.defaults);
		if (defaultError) return defaultError;

		for (const [serverId, thresholds] of Object.entries(
			draftPolicy.serverOverrides,
		)) {
			const overrideError = validateThresholds(thresholds);
			if (!overrideError) continue;

			const serverName =
				servers.find((server) => server.serverId === serverId)
					?.serverName || serverId;
			return `${serverName}: ${overrideError}`;
		}

		return "";
	}, [draftPolicy, servers]);

	const isDirty =
		policy !== null &&
		draftPolicy !== null &&
		JSON.stringify(normalizeServerAlertPolicyForCompare(draftPolicy)) !==
			JSON.stringify(normalizeServerAlertPolicyForCompare(policy));
	const canSave = !isLoading && !isSaving && isDirty && !validationError;
	const customCount = customServerIds.size;

	const updateDefaultThreshold = (
		field: keyof ThresholdFormState,
		value: string,
	) => {
		setDefaultThresholds((current) => ({
			...current,
			[field]: value,
		}));
	};

	const updateServerThreshold = (
		serverId: string,
		field: keyof ThresholdFormState,
		value: string,
	) => {
		setServerThresholds((current) => ({
			...current,
			[serverId]: {
				...(current[serverId] ?? defaultThresholds),
				[field]: value,
			},
		}));
	};

	const toggleServerOverride = (serverId: string, enabled: boolean) => {
		setCustomServerIds((current) => {
			const next = new Set(current);
			if (enabled) {
				next.add(serverId);
				setServerThresholds((thresholds) => ({
					...thresholds,
					[serverId]:
						thresholds[serverId] ?? {
							...defaultThresholds,
						},
				}));
			} else {
				next.delete(serverId);
			}

			return next;
		});
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!canSave || !draftPolicy) return;

		void onSavePolicy(draftPolicy);
	};

	return (
		<SettingsPanelFrame
			badges={
				<>
					<Badge tone="amber">
						Disk {policy?.defaults.diskWarningPercent ?? "--"}%
					</Badge>
					<Badge tone="violet">
						Memory {policy?.defaults.memoryWarningPercent ?? "--"}%
					</Badge>
					<Badge tone="blue">
						CPU {policy?.defaults.cpuLoadWarningPercent ?? "--"}%
					</Badge>
					<Badge>
						{customCount} custom
					</Badge>
				</>
			}
			canSave={canSave}
			error={error}
			icon={<HardDrive size={18} />}
			iconClassName="bg-amber-100 text-amber-700"
			isLoading={isLoading}
			isSaving={isSaving}
			loadingText="Loading alert policy"
			onSubmit={handleSubmit}
			submitLabel="Save policy"
			title="Server Alert Policy"
		>
			<div className="grid grid-cols-3 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
				{serverAlertResources.map((resource) => (
					<ServerAlertThresholdGroup
						key={resource.id}
						disabled={isSaving}
						form={defaultThresholds}
						onChange={updateDefaultThreshold}
						resource={resource}
					/>
				))}
			</div>

			<div className="overflow-hidden rounded-lg border border-slate-200">
				<div className="grid min-h-10 grid-cols-[minmax(0,1fr)_8rem_minmax(0,2fr)] items-center gap-3 border-b border-slate-200 bg-slate-50 px-3.5 text-xs font-bold text-slate-500 uppercase max-lg:hidden">
					<span className="inline-flex items-center gap-2">
						<Server size={15} />
						Server
					</span>
					<span>Mode</span>
					<span>Thresholds</span>
				</div>
				{servers.length === 0 ? (
					<div className="px-3.5 py-5 text-sm font-semibold text-slate-500">
						No servers scanned yet
					</div>
				) : (
					<div className="divide-y divide-slate-200">
						{servers.map((server) => {
							const isCustom = customServerIds.has(server.serverId);
							const form =
								serverThresholds[server.serverId] ??
								defaultThresholds;

							return (
								<ServerAlertOverrideRow
									key={server.serverId}
									disabled={isSaving}
									form={form}
									isCustom={isCustom}
									onThresholdChange={(field, value) =>
										updateServerThreshold(
											server.serverId,
											field,
											value,
										)
									}
									onToggle={(enabled) =>
										toggleServerOverride(
											server.serverId,
											enabled,
										)
									}
									server={server}
								/>
							);
						})}
					</div>
				)}
			</div>

			{validationError && (
				<div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-bold text-rose-800">
					{validationError}
				</div>
			)}
		</SettingsPanelFrame>
	);
}
