import { useState } from "react";
import type { FormEvent } from "react";
import {
	KeyRound,
	LoaderCircle,
	Plus,
	RefreshCw,
	Server,
	ShieldCheck,
	Trash2,
} from "lucide-react";
import type { SshTarget, SshTargetCreateInput } from "../../../../shared/types";

const defaultForm = {
	name: "",
	host: "",
	port: "22",
	username: "",
	privateKeyPath: "",
};

const inputClass =
	"h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-0 focus:border-blue-400";
const labelClass = "grid gap-1.5 text-[13px] font-bold text-slate-500";

export function SshTargetManagerPanel({
	activeScanId,
	error,
	isLoading,
	isSaving,
	lastScanMessage,
	onAddTarget,
	onRemoveTarget,
	onScanAllTargets,
	onScanTarget,
	scanAllId,
	targets,
}: {
	activeScanId: string | null;
	error: string;
	isLoading: boolean;
	isSaving: boolean;
	lastScanMessage: string;
	onAddTarget: (input: SshTargetCreateInput) => Promise<boolean>;
	onRemoveTarget: (targetId: string) => void;
	onScanAllTargets: () => void;
	onScanTarget: (targetId: string) => void;
	scanAllId: string;
	targets: SshTarget[];
}) {
	const [form, setForm] = useState(defaultForm);
	const isScanningAll = activeScanId === scanAllId;

	const updateField = (field: keyof typeof defaultForm, value: string) => {
		setForm((current) => ({
			...current,
			[field]: value,
		}));
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const added = await onAddTarget({
			name: form.name,
			host: form.host,
			port: Number(form.port),
			username: form.username,
			privateKeyPath: form.privateKeyPath,
			enabled: true,
		});

		if (added) {
			setForm(defaultForm);
		}
	};

	return (
		<section className="mb-4.5 overflow-hidden rounded-lg border border-slate-200 bg-white">
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
				<button
					type="button"
					className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-900 bg-slate-900 px-3.5 font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
					onClick={onScanAllTargets}
					disabled={targets.length === 0 || Boolean(activeScanId)}
					aria-label="Scan all SSH targets"
				>
					{isScanningAll ? (
						<LoaderCircle size={16} className="animate-spin" />
					) : (
						<RefreshCw size={16} />
					)}
					Scan all
				</button>
			</div>

			<form
				className="grid grid-cols-[1.1fr_1.1fr_0.45fr_0.75fr_1.6fr_auto] gap-2.5 border-b border-slate-200 bg-slate-50 px-4.5 py-3.5 max-xl:grid-cols-2 max-md:grid-cols-1"
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
						onChange={(event) => updateField("username", event.target.value)}
						placeholder="SSH user"
						required
					/>
				</label>
				<label className={labelClass}>
					Private key path
					<input
						className={inputClass}
						value={form.privateKeyPath}
						onChange={(event) =>
							updateField("privateKeyPath", event.target.value)
						}
						placeholder="Local key file path"
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

			{(error || lastScanMessage) && (
				<div className="flex flex-wrap gap-2 border-b border-slate-200 px-4.5 py-3 text-sm font-bold">
					{lastScanMessage && (
						<span className="text-green-700">{lastScanMessage}</span>
					)}
					{error && <span className="text-rose-700">{error}</span>}
				</div>
			)}

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
							const isScanning = activeScanId === target.id;

							return (
								<tr key={target.id}>
									<td className="border-b border-slate-200 px-3.5 py-3">
										<div className="flex items-center gap-2.5">
											<Server size={16} className="text-blue-600" />
											<strong className="text-slate-900">{target.name}</strong>
										</div>
									</td>
									<td className="border-b border-slate-200 px-3.5 py-3 font-semibold text-slate-600">
										{target.username}@{target.host}:{target.port}
									</td>
									<td className="max-w-95 overflow-hidden border-b border-slate-200 px-3.5 py-3 text-ellipsis font-semibold whitespace-nowrap text-slate-500">
										{target.privateKeyPath}
									</td>
									<td className="border-b border-slate-200 px-3.5 py-3">
										<div className="flex justify-end gap-2">
											<button
												type="button"
												className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
												onClick={() => onScanTarget(target.id)}
												disabled={Boolean(activeScanId)}
												aria-label={`Scan ${target.name}`}
											>
												{isScanning ? (
													<LoaderCircle size={15} className="animate-spin" />
												) : (
													<RefreshCw size={15} />
												)}
												Scan
											</button>
											<button
												type="button"
												className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
												onClick={() => onRemoveTarget(target.id)}
												aria-label={`Delete ${target.name}`}
											>
												<Trash2 size={15} />
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
									{isLoading ? "Loading SSH targets" : "No SSH targets"}
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</section>
	);
}
