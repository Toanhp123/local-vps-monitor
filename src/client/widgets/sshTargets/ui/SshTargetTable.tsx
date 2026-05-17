import { useState } from "react";
import {
	Check,
	Pencil,
	RefreshCw,
	Server,
	Trash2,
	Wifi,
	X,
} from "lucide-react";
import type { SshTarget, SshTargetUpdateInput } from "@shared/types";
import { Button } from "@/shared/ui/Button";
import {
	DataTable,
	DataTableActionsCell,
	DataTableBody,
	DataTableCell,
	DataTableHeaderRow,
	DataTableMessageRow,
	DataTableRow,
	DataTableTitle,
} from "@/shared/ui/DataTable";
import { IconButton } from "@/shared/ui/IconButton";

interface EditFormState {
	host: string;
	name: string;
	port: string;
	privateKeyPath: string;
	username: string;
}

const editInputClass =
	"h-9 min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-900 outline-0 focus:border-blue-400";

const columns = [
	{ key: "target", label: "Target" },
	{ key: "ssh", label: "SSH" },
	{ key: "key-path", label: "Key path" },
	{ align: "right" as const, key: "actions", label: "Actions" },
];

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
		<DataTableRow>
			<DataTableCell noWrap={false}>
				{isEditing ? (
					<div className="flex items-center gap-2.5">
						<Server size={16} className="text-blue-600" />
						<input
							className={editInputClass}
							value={editForm.name}
							onChange={(event) =>
								updateEditField("name", event.target.value)
							}
							aria-label="Target name"
						/>
					</div>
				) : (
					<DataTableTitle
						leading={<Server size={16} className="text-blue-600" />}
						title={target.name}
					/>
				)}
			</DataTableCell>
			<DataTableCell className="font-semibold text-slate-600">
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
			</DataTableCell>
			<DataTableCell className="max-w-95 overflow-hidden text-ellipsis font-semibold text-slate-500">
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
			</DataTableCell>
			<DataTableActionsCell>
					{isEditing ? (
						<>
							<Button
								onClick={saveEdit}
								disabled={isSaving}
								icon={Check}
								isLoading={isSaving}
								variant="accent"
							>
								Save
							</Button>
							<IconButton
								onClick={cancelEditing}
								aria-label={`Cancel editing ${target.name}`}
								icon={X}
							/>
						</>
					) : (
						<>
							<Button
								onClick={() => onTestTarget(target.id)}
								disabled={Boolean(isScanDisabled || activeTestId)}
								aria-label={`Test ${target.name}`}
								icon={Wifi}
								isLoading={isTesting}
							>
								{isTesting ? "Testing" : "Test"}
							</Button>
							<Button
								onClick={startEditing}
								icon={Pencil}
							>
								Edit
							</Button>
							<Button
								onClick={() => onScanTarget(target.id)}
								disabled={Boolean(isScanDisabled)}
								aria-label={`Scan ${target.name}`}
								icon={RefreshCw}
								isLoading={isScanning}
							>
								{isScanning ? "Scanning" : "Scan"}
							</Button>
							{isConfirmingDelete ? (
								<Button
									onClick={handleRemoveTarget}
									aria-label={`Delete ${target.name}`}
									icon={Trash2}
									variant="dangerSoft"
								>
									Confirm
								</Button>
							) : (
								<IconButton
									onClick={handleRemoveTarget}
									aria-label={`Delete ${target.name}`}
									icon={Trash2}
									variant="danger"
								/>
							)}
						</>
					)}
			</DataTableActionsCell>
		</DataTableRow>
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
		<DataTable minWidth="min-w-220">
			<DataTableHeaderRow columns={columns} />
			<DataTableBody>
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
						<DataTableMessageRow colSpan={4}>
							{isLoading ? "Loading SSH targets" : "No SSH targets"}
						</DataTableMessageRow>
					)}
			</DataTableBody>
		</DataTable>
	);
}
