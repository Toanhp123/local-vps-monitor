import type { StoredServer } from "../../../../shared/types";
import {
	serverAlertResources,
	type ThresholdFormState,
} from "../model/serverAlertPolicyForm";
import { ServerAlertThresholdGroup } from "./ServerAlertThresholdGroup";

function ModeToggle({
	disabled,
	isCustom,
	onToggle,
}: {
	disabled: boolean;
	isCustom: boolean;
	onToggle: (enabled: boolean) => void;
}) {
	return (
		<button
			type="button"
			className={`inline-flex min-h-9 w-27 cursor-pointer items-center justify-between gap-2 rounded-lg border px-2.5 text-xs font-extrabold disabled:cursor-not-allowed disabled:opacity-60 ${
				isCustom
					? "border-blue-200 bg-blue-50 text-blue-700"
					: "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
			}`}
			disabled={disabled}
			onClick={() => onToggle(!isCustom)}
			aria-pressed={isCustom}
		>
			<span>{isCustom ? "Custom" : "Default"}</span>
			<span
				className={`relative h-4.5 w-8 rounded-full transition-colors ${
					isCustom ? "bg-blue-600" : "bg-slate-300"
				}`}
			>
				<span
					className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-transform ${
						isCustom ? "translate-x-4" : "translate-x-0.5"
					}`}
				/>
			</span>
		</button>
	);
}

export function ServerAlertOverrideRow({
	disabled,
	form,
	isCustom,
	onThresholdChange,
	onToggle,
	server,
}: {
	disabled: boolean;
	form: ThresholdFormState;
	isCustom: boolean;
	onThresholdChange: (field: keyof ThresholdFormState, value: string) => void;
	onToggle: (enabled: boolean) => void;
	server: StoredServer;
}) {
	return (
		<div className="grid grid-cols-[minmax(0,1fr)_8rem_minmax(0,2fr)] items-start gap-3 px-3.5 py-3 max-lg:grid-cols-1">
			<div className="min-w-0 pt-1">
				<strong className="block truncate text-sm text-slate-900">
					{server.serverName}
				</strong>
				<span className="block truncate text-xs font-semibold text-slate-500">
					{isCustom ? "Custom thresholds" : "Default thresholds"}
				</span>
			</div>
			<ModeToggle
				disabled={disabled}
				isCustom={isCustom}
				onToggle={onToggle}
			/>
			<div className="grid grid-cols-3 gap-2 max-xl:grid-cols-1">
				{serverAlertResources.map((resource) => (
					<ServerAlertThresholdGroup
						key={resource.id}
						disabled={disabled || !isCustom}
						form={form}
						onChange={onThresholdChange}
						resource={resource}
					/>
				))}
			</div>
		</div>
	);
}
