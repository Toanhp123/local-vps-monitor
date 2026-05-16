import { useEffect, useState, type FormEvent } from "react";
import { Plus, XCircle } from "lucide-react";
import type {
	HttpCheck,
	HttpCheckCreateInput,
	HttpCheckUpdateInput,
	StoredServer,
} from "../../../../shared/types";
import { appDisplayName } from "../../../entities/application/model/appMonitoringPolicy";
import { SelectField } from "../../../shared/ui/SelectField";

const defaultForm = {
	appId: "",
	enabled: true,
	expectedStatusMax: "399",
	expectedStatusMin: "200",
	method: "GET",
	name: "",
	serverId: "",
	timeoutMs: "5000",
	url: "",
};

const inputClass =
	"min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-300";
const labelClass = "grid gap-1.5 text-xs font-bold text-slate-500";
const methodOptions = [
	{ label: "GET", value: "GET" },
	{ label: "HEAD", value: "HEAD" },
];

const formFromCheck = (check: HttpCheck) => ({
	appId: check.appId ?? "",
	enabled: check.enabled,
	expectedStatusMax: String(check.expectedStatusMax),
	expectedStatusMin: String(check.expectedStatusMin),
	method: check.method,
	name: check.name,
	serverId: check.serverId ?? "",
	timeoutMs: String(check.timeoutMs),
	url: check.url,
});

const toInput = (form: typeof defaultForm): HttpCheckCreateInput => ({
	appId: form.appId,
	enabled: form.enabled,
	expectedStatusMax: Number(form.expectedStatusMax),
	expectedStatusMin: Number(form.expectedStatusMin),
	method: form.method as HttpCheckCreateInput["method"],
	name: form.name,
	serverId: form.serverId,
	timeoutMs: Number(form.timeoutMs),
	url: form.url,
});

export function HttpCheckForm({
	editingCheck,
	isSaving,
	onAddCheck,
	onCancelEdit,
	onEditCheck,
	servers,
}: {
	editingCheck: HttpCheck | null;
	isSaving: boolean;
	onAddCheck: (input: HttpCheckCreateInput) => Promise<boolean>;
	onCancelEdit: () => void;
	onEditCheck: (checkId: string, input: HttpCheckUpdateInput) => Promise<boolean>;
	servers: StoredServer[];
}) {
	const [form, setForm] = useState(defaultForm);
	const selectedServer = servers.find(
		(server) => server.serverId === form.serverId,
	);
	const apps = selectedServer?.apps ?? [];
	const serverOptions = [
		{ label: "None", value: "" },
		...servers.map((server) => ({
			label: server.serverName,
			value: server.serverId,
		})),
	];
	const appOptions = [
		{ label: "None", value: "" },
		...apps.map((app) => ({
			label: appDisplayName(app),
			value: app.id,
		})),
	];

	useEffect(() => {
		setForm(editingCheck ? formFromCheck(editingCheck) : defaultForm);
	}, [editingCheck]);

	const updateField = (
		field: keyof typeof defaultForm,
		value: string | boolean,
	) => {
		setForm((current) => ({
			...current,
			[field]: value,
			...(field === "serverId" ? { appId: "" } : {}),
		}));
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const input = toInput(form);
		const saved = editingCheck
			? await onEditCheck(editingCheck.id, input)
			: await onAddCheck(input);

		if (saved) {
			setForm(defaultForm);
			onCancelEdit();
		}
	};

	return (
		<form
			className="grid grid-cols-12 gap-3 border-b border-slate-200 bg-slate-50 px-4.5 py-4 max-lg:grid-cols-2 max-md:grid-cols-1"
			onSubmit={handleSubmit}
		>
			<label className={`${labelClass} col-span-2 max-lg:col-span-1`}>
				Name
				<input
					className={inputClass}
					maxLength={100}
					onChange={(event) => updateField("name", event.target.value)}
					required
					value={form.name}
				/>
			</label>
			<label className={`${labelClass} col-span-4 max-lg:col-span-1`}>
				URL
				<input
					className={inputClass}
					onChange={(event) => updateField("url", event.target.value)}
					placeholder="https://example.com/health"
					required
					type="url"
					value={form.url}
				/>
			</label>
			<div className={labelClass}>
				<span>Method</span>
				<SelectField
					ariaLabel="HTTP check method"
					onChange={(value) => updateField("method", value)}
					options={methodOptions}
					value={form.method}
				/>
			</div>
			<label className={labelClass}>
				Min
				<input
					className={inputClass}
					max={599}
					min={100}
					onChange={(event) =>
						updateField("expectedStatusMin", event.target.value)
					}
					required
					type="number"
					value={form.expectedStatusMin}
				/>
			</label>
			<label className={labelClass}>
				Max
				<input
					className={inputClass}
					max={599}
					min={100}
					onChange={(event) =>
						updateField("expectedStatusMax", event.target.value)
					}
					required
					type="number"
					value={form.expectedStatusMax}
				/>
			</label>
			<label className={labelClass}>
				Timeout
				<input
					className={inputClass}
					max={60000}
					min={500}
					onChange={(event) => updateField("timeoutMs", event.target.value)}
					required
					step={500}
					type="number"
					value={form.timeoutMs}
				/>
			</label>
			<div className={labelClass}>
				<span>Server</span>
				<SelectField
					ariaLabel="Linked server"
					onChange={(value) => updateField("serverId", value)}
					options={serverOptions}
					value={form.serverId}
				/>
			</div>
			<div className={labelClass}>
				<span>App</span>
				<SelectField
					ariaLabel="Linked app"
					disabled={!selectedServer}
					onChange={(value) => updateField("appId", value)}
					options={appOptions}
					placeholder="None"
					value={form.appId}
				/>
			</div>
			<label className="col-span-1 flex min-h-10 items-end gap-2 text-xs font-bold text-slate-500">
				<input
					checked={form.enabled}
					className="mb-3 h-4 w-4"
					onChange={(event) => updateField("enabled", event.target.checked)}
					type="checkbox"
				/>
				<span className="pb-2.5">Enabled</span>
			</label>
			<div className="col-span-12 flex flex-wrap justify-end gap-2 max-lg:col-span-2 max-md:col-span-1">
				{editingCheck && (
					<button
						type="button"
						className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
						onClick={onCancelEdit}
					>
						<XCircle size={16} />
						Cancel
					</button>
				)}
				<button
					type="submit"
					className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-3.5 font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
					disabled={isSaving}
				>
					<Plus size={16} />
					{editingCheck ? "Save check" : "Add check"}
				</button>
			</div>
		</form>
	);
}
