import { useState } from "react";
import type { FormEvent } from "react";
import {
	ChevronDown,
	ChevronUp,
	CircleHelp,
	KeyRound,
	LoaderCircle,
	Plus,
	RefreshCw,
	Server,
	ShieldCheck,
	Trash2,
} from "lucide-react";
import type {
	SshTarget,
	SshTargetBootstrapInput,
	SshTargetCreateInput,
} from "../../../../shared/types";

type SshAuthMode = "password" | "key";

const defaultForm = {
	name: "",
	host: "",
	port: "22",
	username: "",
	authMode: "password" as SshAuthMode,
	password: "",
	privateKeyPath: "",
};

const inputClass =
	"h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-0 focus:border-blue-400";
const labelClass = "grid gap-1.5 text-[13px] font-bold text-slate-500";

export function SshTargetManagerPanel({
	activeScanId,
	error,
	isLoading,
	isScanDisabled,
	isSaving,
	onAddTarget,
	onBootstrapTarget,
	onRemoveTarget,
	onScanTarget,
	targets,
}: {
	activeScanId: string | null;
	error: string;
	isLoading: boolean;
	isScanDisabled: boolean;
	isSaving: boolean;
	onAddTarget: (input: SshTargetCreateInput) => Promise<boolean>;
	onBootstrapTarget: (input: SshTargetBootstrapInput) => Promise<boolean>;
	onRemoveTarget: (targetId: string) => void;
	onScanTarget: (targetId: string) => void;
	targets: SshTarget[];
}) {
	const [form, setForm] = useState(defaultForm);
	const [isManagingTargets, setIsManagingTargets] = useState(false);
	const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
	const showManagement =
		(!isLoading && targets.length === 0) || isManagingTargets;
	const credentialLabel =
		form.authMode === "password" ? "Setup password" : "Private key path";
	const credentialHelp =
		form.authMode === "password"
			? "Used only for this setup request, then discarded. Not stored."
			: "Use the private key file, not the .pub file.";
	const credentialPlaceholder =
		form.authMode === "password" ? "SSH password" : "~/.ssh/vps_monitor";

	const updateField = <Field extends keyof typeof defaultForm>(
		field: Field,
		value: (typeof defaultForm)[Field],
	) => {
		setForm((current) => ({
			...current,
			[field]: value,
		}));
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const baseInput = {
			name: form.name,
			host: form.host,
			port: Number(form.port),
			username: form.username,
			enabled: true,
		};
		const added =
			form.authMode === "password"
				? await onBootstrapTarget({
						...baseInput,
						password: form.password,
					})
				: await onAddTarget({
						...baseInput,
						privateKeyPath: form.privateKeyPath,
					});

		if (added) {
			setForm(defaultForm);
		}
	};

	const handleRemoveTarget = (targetId: string) => {
		if (pendingDeleteId !== targetId) {
			setPendingDeleteId(targetId);
			return;
		}

		onRemoveTarget(targetId);
		setPendingDeleteId(null);
	};

	return (
		<section
			id="ssh-targets"
			className="mb-4.5 scroll-mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white"
		>
			<div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4.5 py-3.5 max-lg:flex-col max-lg:items-stretch">
				<div className="flex min-w-0 items-center gap-2.5">
					<div className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
						<KeyRound size={18} />
					</div>
					<div className="min-w-0">
						<h2 className="text-lg leading-tight font-extrabold text-slate-900">
							Local SSH Targets
						</h2>
						<div className="mt-1 flex flex-wrap gap-1.5">
							<span className="inline-flex min-h-6 items-center rounded-full bg-slate-100 px-2.5 text-xs font-extrabold text-slate-700">
								{targets.length} targets
							</span>
							<span className="inline-flex min-h-6 items-center gap-1.5 rounded-full bg-green-100 px-2.5 text-xs font-extrabold text-green-800">
								<ShieldCheck size={14} />
								Local only
							</span>
							<span className="inline-flex min-h-6 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-xs font-extrabold text-slate-700">
								<KeyRound size={14} />
								Key auth
							</span>
						</div>
					</div>
				</div>
				<div className="flex flex-wrap items-center justify-end gap-2.5 max-lg:justify-start">
					{targets.length > 0 && (
						<button
							type="button"
							className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
							onClick={() =>
								setIsManagingTargets((current) => !current)
							}
							aria-expanded={showManagement}
						>
							{showManagement ? (
								<ChevronUp size={16} />
							) : (
								<ChevronDown size={16} />
							)}
							Manage
						</button>
					)}
				</div>
			</div>

			{error && showManagement && (
				<div className="flex min-w-0 flex-wrap gap-2 border-b border-slate-200 px-4.5 py-3 text-sm font-bold">
					<span className="min-w-0 break-words text-rose-700">
						{error}
					</span>
				</div>
			)}

			{showManagement && (
				<>
					<form
						className="grid grid-cols-[1.1fr_1.1fr_0.45fr_0.75fr_1fr_1.35fr_auto] gap-2.5 border-b border-slate-200 bg-slate-50 px-4.5 py-3.5 max-2xl:grid-cols-3 max-xl:grid-cols-2 max-md:grid-cols-1"
						onSubmit={handleSubmit}
					>
						<label className={labelClass}>
							Name
							<input
								className={inputClass}
								value={form.name}
								onChange={(event) =>
									updateField("name", event.target.value)
								}
								placeholder="My VPS"
								required
							/>
						</label>
						<label className={labelClass}>
							Host
							<input
								className={inputClass}
								value={form.host}
								onChange={(event) =>
									updateField("host", event.target.value)
								}
								placeholder="IP or hostname"
								required
							/>
						</label>
						<label className={labelClass}>
							Port
							<input
								className={inputClass}
								value={form.port}
								onChange={(event) =>
									updateField("port", event.target.value)
								}
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
									onClick={() =>
										updateField("authMode", "password")
									}
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
									onClick={() =>
										updateField("authMode", "key")
									}
								>
									Key path
								</button>
							</div>
						</div>
						<label className={labelClass}>
							<span className="flex items-center gap-1.5">
								{credentialLabel}
								<span
									className="group relative inline-flex text-slate-400"
									aria-label={credentialHelp}
									tabIndex={0}
								>
									<CircleHelp size={13} />
									<span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-md bg-slate-950 px-2.5 py-2 text-xs leading-4 font-semibold text-white opacity-0 shadow-lg transition-opacity group-focus:opacity-100 group-hover:opacity-100">
										{credentialHelp}
									</span>
								</span>
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
										? updateField(
												"password",
												event.target.value,
											)
										: updateField(
												"privateKeyPath",
												event.target.value,
											)
								}
								placeholder={credentialPlaceholder}
								type={
									form.authMode === "password"
										? "password"
										: "text"
								}
								autoComplete={
									form.authMode === "password"
										? "current-password"
										: "off"
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
									<LoaderCircle
										size={16}
										className="animate-spin"
									/>
								) : (
									<Plus size={16} />
								)}
								Add
							</button>
						</div>
					</form>

					<div className="overflow-x-auto">
						<table className="w-full min-w-220 border-collapse">
							<thead>
								<tr>
									<th className="border-b border-slate-200 bg-white px-3.5 py-3 text-left text-xs font-bold text-slate-500 uppercase">
										Target
									</th>
									<th className="border-b border-slate-200 bg-white px-3.5 py-3 text-left text-xs font-bold text-slate-500 uppercase">
										SSH
									</th>
									<th className="border-b border-slate-200 bg-white px-3.5 py-3 text-left text-xs font-bold text-slate-500 uppercase">
										Key path
									</th>
									<th className="border-b border-slate-200 bg-white px-3.5 py-3 text-right text-xs font-bold text-slate-500 uppercase">
										Actions
									</th>
								</tr>
							</thead>
							<tbody>
								{targets.map((target) => {
									const isScanning =
										activeScanId === target.id;
									const isConfirmingDelete =
										pendingDeleteId === target.id;

									return (
										<tr key={target.id}>
											<td className="border-b border-slate-200 px-3.5 py-3">
												<div className="flex items-center gap-2.5">
													<Server
														size={16}
														className="text-blue-600"
													/>
													<strong className="text-slate-900">
														{target.name}
													</strong>
												</div>
											</td>
											<td className="border-b border-slate-200 px-3.5 py-3 font-semibold text-slate-600">
												{target.username}@{target.host}:
												{target.port}
											</td>
											<td className="max-w-95 overflow-hidden border-b border-slate-200 px-3.5 py-3 text-ellipsis font-semibold whitespace-nowrap text-slate-500">
												{target.privateKeyPath}
											</td>
											<td className="border-b border-slate-200 px-3.5 py-3">
												<div className="flex justify-end gap-2">
													<button
														type="button"
														className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
														onClick={() =>
															onScanTarget(
																target.id,
															)
														}
														disabled={Boolean(
															isScanDisabled,
														)}
														aria-label={`Scan ${target.name}`}
													>
														{isScanning ? (
															<LoaderCircle
																size={15}
																className="animate-spin"
															/>
														) : (
															<RefreshCw
																size={15}
															/>
														)}
														{isScanning
															? "Scanning"
															: "Scan"}
													</button>
													<button
														type="button"
														className={`inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 font-bold ${
															isConfirmingDelete
																? "border-rose-200 bg-rose-50 text-rose-700"
																: "border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
														}`}
														onClick={() =>
															handleRemoveTarget(
																target.id,
															)
														}
														aria-label={`Delete ${target.name}`}
													>
														<Trash2 size={15} />
														{isConfirmingDelete
															? "Confirm"
															: ""}
													</button>
												</div>
											</td>
										</tr>
									);
								})}
								{targets.length === 0 && (
									<tr>
										<td
											colSpan={4}
											className="h-18 border-b border-slate-200 text-center font-semibold text-slate-500"
										>
											{isLoading
												? "Loading SSH targets"
												: "No SSH targets"}
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</>
			)}
		</section>
	);
}
