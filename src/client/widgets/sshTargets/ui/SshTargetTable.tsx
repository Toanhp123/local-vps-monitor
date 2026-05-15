import { useState } from "react";
import {
	Check,
	LoaderCircle,
	Pencil,
	RefreshCw,
	Server,
	Trash2,
	Wifi,
	X,
} from "lucide-react";
import type { SshTarget, SshTargetUpdateInput } from "../../../../shared/types";

interface EditFormState {
	host: string;
	name: string;
	port: string;
	privateKeyPath: string;
	username: string;
}

const editInputClass =
	"h-9 min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-900 outline-0 focus:border-blue-400";

const editFormFromTarget = (target: SshTarget): EditFormState => ({
	name: target.name,
	host: target.host,
	port: String(target.port),
	username: target.username,
	privateKeyPath: target.privateKeyPath,
});

function SshTargetRow({
	activeScanId,
	activeTestId,
	editingTargetId,
	isSaving,
	isScanDisabled,
	onEditTarget,
	onRemoveTarget,
	onScanTarget,
	onTestTarget,
	pendingDeleteId,
	setEditingTargetId,
	setPendingDeleteId,
	target,
}: {
	activeScanId: string | null;
	activeTestId: string | null;
	editingTargetId: string | null;
	isSaving: boolean;
	isScanDisabled: boolean;
	onEditTarget: (
		targetId: string,
		input: SshTargetUpdateInput,
	) => Promise<boolean>;
	onRemoveTarget: (targetId: string) => void;
	onScanTarget: (targetId: string) => void;
	onTestTarget: (targetId: string) => void;
	pendingDeleteId: string | null;
	setEditingTargetId: (targetId: string | null) => void;
	setPendingDeleteId: (targetId: string | null) => void;
	target: SshTarget;
}) {
	const [editForm, setEditForm] = useState(() => editFormFromTarget(target));
	const isScanning = activeScanId === target.id;
	const isTesting = activeTestId === target.id;
	const isEditing = editingTargetId === target.id;
	const isConfirmingDelete = pendingDeleteId === target.id;

	const updateEditField = (field: keyof EditFormState, value: string) => {
		setEditForm((current) => ({
			...current,
			[field]: value,
		}));
	};

	const startEditing = () => {
		setEditForm(editFormFromTarget(target));
		setEditingTargetId(target.id);
		setPendingDeleteId(null);
	};

	const cancelEditing = () => {
		setEditForm(editFormFromTarget(target));
		setEditingTargetId(null);
	};

	const saveEdit = async () => {
		const input: SshTargetUpdateInput = {
			name: editForm.name,
			host: editForm.host,
			port: Number(editForm.port),
			username: editForm.username,
			privateKeyPath: editForm.privateKeyPath,
		};

		const saved = await onEditTarget(target.id, input);
		if (saved) setEditingTargetId(null);
	};

	const handleRemoveTarget = () => {
		if (!isConfirmingDelete) {
			setPendingDeleteId(target.id);
			setEditingTargetId(null);
			return;
		}

		onRemoveTarget(target.id);
		setPendingDeleteId(null);
	};

	return (
		<tr>
			<td className="border-b border-slate-200 px-3.5 py-3">
				<div className="flex items-center gap-2.5">
					<Server size={16} className="text-blue-600" />
					{isEditing ? (
						<input
							className={editInputClass}
							value={editForm.name}
							onChange={(event) =>
								updateEditField("name", event.target.value)
							}
							aria-label="Target name"
						/>
					) : (
						<strong className="text-slate-900">{target.name}</strong>
					)}
				</div>
			</td>
			<td className="border-b border-slate-200 px-3.5 py-3 font-semibold text-slate-600">
				{isEditing ? (
					<div className="grid grid-cols-[0.9fr_1.4fr_0.65fr] gap-1.5">
						<input
							className={editInputClass}
							value={editForm.username}
							onChange={(event) =>
								updateEditField("username", event.target.value)
							}
							aria-label="SSH user"
						/>
						<input
							className={editInputClass}
							value={editForm.host}
							onChange={(event) =>
								updateEditField("host", event.target.value)
							}
							aria-label="Host"
						/>
						<input
							className={editInputClass}
							value={editForm.port}
							onChange={(event) =>
								updateEditField("port", event.target.value)
							}
							inputMode="numeric"
							type="number"
							min={1}
							max={65535}
							aria-label="Port"
						/>
					</div>
				) : (
					`${target.username}@${target.host}:${target.port}`
				)}
			</td>
			<td className="max-w-95 overflow-hidden border-b border-slate-200 px-3.5 py-3 text-ellipsis font-semibold whitespace-nowrap text-slate-500">
				{isEditing ? (
					<input
						className={`${editInputClass} w-full`}
						value={editForm.privateKeyPath}
						onChange={(event) =>
							updateEditField("privateKeyPath", event.target.value)
						}
						aria-label="Private key path"
					/>
				) : (
					target.privateKeyPath
				)}
			</td>
			<td className="border-b border-slate-200 px-3.5 py-3">
				<div className="flex justify-end gap-2">
					{isEditing ? (
						<>
							<button
								type="button"
								className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-3 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
								onClick={saveEdit}
								disabled={isSaving}
							>
								{isSaving ? (
									<LoaderCircle size={15} className="animate-spin" />
								) : (
									<Check size={15} />
								)}
								Save
							</button>
							<button
								type="button"
								className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 font-bold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
								onClick={cancelEditing}
							>
								<X size={15} />
							</button>
						</>
					) : (
						<>
							<button
								type="button"
								className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
								onClick={() => onTestTarget(target.id)}
								disabled={Boolean(isScanDisabled || activeTestId)}
								aria-label={`Test ${target.name}`}
							>
								{isTesting ? (
									<LoaderCircle size={15} className="animate-spin" />
								) : (
									<Wifi size={15} />
								)}
								{isTesting ? "Testing" : "Test"}
							</button>
							<button
								type="button"
								className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
								onClick={startEditing}
							>
								<Pencil size={15} />
								Edit
							</button>
							<button
								type="button"
								className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
								onClick={() => onScanTarget(target.id)}
								disabled={Boolean(isScanDisabled)}
								aria-label={`Scan ${target.name}`}
							>
								{isScanning ? (
									<LoaderCircle size={15} className="animate-spin" />
								) : (
									<RefreshCw size={15} />
								)}
								{isScanning ? "Scanning" : "Scan"}
							</button>
							<button
								type="button"
								className={`inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 font-bold ${
									isConfirmingDelete
										? "border-rose-200 bg-rose-50 text-rose-700"
										: "border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
								}`}
								onClick={handleRemoveTarget}
								aria-label={`Delete ${target.name}`}
							>
								<Trash2 size={15} />
								{isConfirmingDelete ? "Confirm" : ""}
							</button>
						</>
					)}
				</div>
			</td>
		</tr>
	);
}

export function SshTargetTable({
	activeScanId,
	activeTestId,
	isLoading,
	isScanDisabled,
	isSaving,
	onEditTarget,
	onRemoveTarget,
	onScanTarget,
	onTestTarget,
	targets,
}: {
	activeScanId: string | null;
	activeTestId: string | null;
	isLoading: boolean;
	isScanDisabled: boolean;
	isSaving: boolean;
	onEditTarget: (
		targetId: string,
		input: SshTargetUpdateInput,
	) => Promise<boolean>;
	onRemoveTarget: (targetId: string) => void;
	onScanTarget: (targetId: string) => void;
	onTestTarget: (targetId: string) => void;
	targets: SshTarget[];
}) {
	const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
	const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

	return (
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
					{targets.map((target) => (
						<SshTargetRow
							key={target.id}
							activeScanId={activeScanId}
							activeTestId={activeTestId}
							editingTargetId={editingTargetId}
							isSaving={isSaving}
							isScanDisabled={isScanDisabled}
							onEditTarget={onEditTarget}
							onRemoveTarget={onRemoveTarget}
							onScanTarget={onScanTarget}
							onTestTarget={onTestTarget}
							pendingDeleteId={pendingDeleteId}
							setEditingTargetId={setEditingTargetId}
							setPendingDeleteId={setPendingDeleteId}
							target={target}
						/>
					))}
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
	);
}
