import { CircleHelp, LoaderCircle, Plus } from "lucide-react";
import type {
	SshTargetBootstrapInput,
	SshTargetCreateInput,
} from "../../../../shared/types";
import { useSshTargetForm } from "../model/useSshTargetForm";

const inputClass =
	"h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-0 focus:border-blue-400";
const labelClass = "grid gap-1.5 text-[13px] font-bold text-slate-500";

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
			<label className={labelClass}>
				Name
				<input
					className={inputClass}
					value={form.name}
					onChange={(event) => updateField("name", event.target.value)}
					placeholder="My VPS"
					required
				/>
			</label>
			<label className={labelClass}>
				Host
				<input
					className={inputClass}
					value={form.host}
					onChange={(event) => updateField("host", event.target.value)}
					placeholder="IP or hostname"
					required
				/>
			</label>
			<label className={labelClass}>
				Port
				<input
					className={inputClass}
					value={form.port}
					onChange={(event) => updateField("port", event.target.value)}
					inputMode="numeric"
					min={1}
					max={65535}
					type="number"
					required
				/>
			</label>
			<label className={labelClass}>
				User
				<input
					className={inputClass}
					value={form.username}
					onChange={(event) =>
						updateField("username", event.target.value)
					}
					placeholder="SSH user"
					required
				/>
			</label>
			<div className={labelClass}>
				Auth
				<div className="grid h-10 grid-cols-2 overflow-hidden rounded-lg border border-slate-200 bg-white p-0.5">
					<button
						type="button"
						className={`cursor-pointer rounded-md px-2 text-xs font-extrabold ${
							form.authMode === "password"
								? "bg-blue-600 text-white"
								: "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
						}`}
						onClick={() => updateField("authMode", "password")}
					>
						Password
					</button>
					<button
						type="button"
						className={`cursor-pointer rounded-md px-2 text-xs font-extrabold ${
							form.authMode === "key"
								? "bg-blue-600 text-white"
								: "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
						}`}
						onClick={() => updateField("authMode", "key")}
					>
						Key path
					</button>
				</div>
			</div>
			<label className={labelClass}>
				<span className="flex items-center gap-1.5">
					{credentialLabel}
					<CredentialHelpTooltip message={credentialHelp} />
				</span>
				<input
					className={inputClass}
					value={
						form.authMode === "password"
							? form.password
							: form.privateKeyPath
					}
					onChange={(event) =>
						form.authMode === "password"
							? updateField("password", event.target.value)
							: updateField("privateKeyPath", event.target.value)
					}
					placeholder={credentialPlaceholder}
					type={form.authMode === "password" ? "password" : "text"}
					autoComplete={
						form.authMode === "password" ? "current-password" : "off"
					}
					required
				/>
			</label>
			<div className="flex items-end">
				<button
					type="submit"
					className="inline-flex h-10 w-full min-w-28 cursor-pointer items-center justify-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-3.5 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
					disabled={isSaving}
				>
					{isSaving ? (
						<LoaderCircle size={16} className="animate-spin" />
					) : (
						<Plus size={16} />
					)}
					Add
				</button>
			</div>
		</form>
	);
}
