import { CircleHelp, Plus } from "lucide-react";
import type {
	SshTargetBootstrapInput,
	SshTargetCreateInput,
} from "../../../../shared/types";
import { Button } from "../../../shared/ui/Button";
import { NumberInputField } from "../../../shared/ui/NumberInputField";
import { SegmentedControl } from "../../../shared/ui/SegmentedControl";
import { TextInputField } from "../../../shared/ui/TextInputField";
import { useSshTargetForm, type SshAuthMode } from "../model/useSshTargetForm";

const labelClass = "grid gap-1.5 text-[13px] font-bold text-slate-500";
const authModeOptions: Array<{ label: string; value: SshAuthMode }> = [
	{ label: "Key path", value: "key" },
	{ label: "Password", value: "password" },
];

function CredentialHelpTooltip({ message }: { message: string }) {
	return (
		<span
			className="group relative inline-flex text-slate-400"
			aria-label={message}
			tabIndex={0}
		>
			<CircleHelp size={13} />
			<span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-md bg-slate-950 px-2.5 py-2 text-xs leading-4 font-semibold text-white opacity-0 shadow-lg transition-opacity group-focus:opacity-100 group-hover:opacity-100">
				{message}
			</span>
		</span>
	);
}

export function SshTargetForm({
	isSaving,
	onAddTarget,
	onBootstrapTarget,
}: {
	isSaving: boolean;
	onAddTarget: (input: SshTargetCreateInput) => Promise<boolean>;
	onBootstrapTarget: (input: SshTargetBootstrapInput) => Promise<boolean>;
}) {
	const {
		credentialHelp,
		credentialLabel,
		credentialPlaceholder,
		form,
		handleSubmit,
		updateField,
	} = useSshTargetForm({
		onAddTarget,
		onBootstrapTarget,
	});

	return (
		<form
			className="grid grid-cols-[1.1fr_1.1fr_0.45fr_0.75fr_1fr_1.35fr_auto] gap-2.5 border-b border-slate-200 bg-slate-50 px-4.5 py-3.5 max-2xl:grid-cols-3 max-xl:grid-cols-2 max-md:grid-cols-1"
			onSubmit={handleSubmit}
		>
			<TextInputField
				inputClassName="font-semibold focus:border-blue-400"
				label="Name"
				labelClassName="text-[13px] font-bold text-slate-500"
				onChange={(value) => updateField("name", value)}
				placeholder="My VPS"
				required
				value={form.name}
			/>
			<TextInputField
				inputClassName="font-semibold focus:border-blue-400"
				label="Host"
				labelClassName="text-[13px] font-bold text-slate-500"
				onChange={(value) => updateField("host", value)}
				placeholder="IP or hostname"
				required
				value={form.host}
			/>
			<NumberInputField
				label="Port"
				labelClassName="text-[13px] font-bold text-slate-500"
				max={65535}
				min={1}
				onChange={(value) => updateField("port", value)}
				required
				value={form.port}
			/>
			<TextInputField
				inputClassName="font-semibold focus:border-blue-400"
				label="User"
				labelClassName="text-[13px] font-bold text-slate-500"
				onChange={(value) => updateField("username", value)}
				placeholder="SSH user"
				required
				value={form.username}
			/>
			<div className={labelClass}>
				Auth
				<SegmentedControl
					ariaLabel="SSH auth mode"
					className="w-full"
					onChange={(value) => updateField("authMode", value)}
					options={authModeOptions}
					value={form.authMode}
				/>
			</div>
			<TextInputField
				autoComplete={
					form.authMode === "password" ? "current-password" : "off"
				}
				inputClassName="font-semibold focus:border-blue-400"
				label={
					<span className="flex items-center gap-1.5">
						{credentialLabel}
						<CredentialHelpTooltip message={credentialHelp} />
					</span>
				}
				labelClassName="text-[13px] font-bold text-slate-500"
				onChange={(value) =>
					form.authMode === "password"
						? updateField("password", value)
						: updateField("privateKeyPath", value)
				}
				placeholder={credentialPlaceholder}
				required
				type={form.authMode === "password" ? "password" : "text"}
				value={
					form.authMode === "password"
						? form.password
						: form.privateKeyPath
				}
			/>
			<div className="flex items-end">
				<Button
					type="submit"
					className="h-10 w-full min-w-28"
					disabled={isSaving}
					icon={Plus}
					isLoading={isSaving}
					size="lg"
					variant="accent"
				>
					Add
				</Button>
			</div>
		</form>
	);
}
