import { useState } from "react";
import { ChevronDown, ChevronUp, LoaderCircle, Upload } from "lucide-react";
import type { SshTargetBulkImportInput } from "../../../../shared/types";
import type { SshAuthMode } from "../model/useSshTargetForm";

const sampleRows: Record<SshAuthMode, string> = {
	key: "Production VPS,203.0.113.10,22,root,~/.ssh/vps_monitor",
	password: "Production VPS,203.0.113.10,22,root,my-temporary-password",
};

const parseCsvLine = (line: string) => {
	const values: string[] = [];
	let current = "";
	let isQuoted = false;

	for (let index = 0; index < line.length; index += 1) {
		const character = line[index];
		const nextCharacter = line[index + 1];

		if (character === '"' && isQuoted && nextCharacter === '"') {
			current += '"';
			index += 1;
			continue;
		}

		if (character === '"') {
			isQuoted = !isQuoted;
			continue;
		}

		if (character === "," && !isQuoted) {
			values.push(current.trim());
			current = "";
			continue;
		}

		current += character;
	}

	values.push(current.trim());
	return values;
};

const parseImportText = (
	authMode: SshAuthMode,
	text: string,
): SshTargetBulkImportInput => {
	const rows = text
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith("#"));
	const targets = rows.map((row, index) => {
		const [name, host, port, username, credential] = parseCsvLine(row);
		const parsedPort = Number(port);

		if (!name || !host || !port || !username || !credential) {
			throw new Error(`Row ${index + 1} must have 5 comma-separated values.`);
		}

		if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
			throw new Error(`Row ${index + 1} has an invalid SSH port.`);
		}

		return {
			name,
			host,
			port: parsedPort,
			username,
			enabled: true,
			...(authMode === "password"
				? { password: credential }
				: { privateKeyPath: credential }),
		};
	});

	if (targets.length === 0) {
		throw new Error("Paste at least one target row.");
	}

	return authMode === "password"
		? {
				authMode,
				targets: targets as Extract<
					SshTargetBulkImportInput,
					{ authMode: "password" }
				>["targets"],
			}
		: {
				authMode,
				targets: targets as Extract<
					SshTargetBulkImportInput,
					{ authMode: "key" }
				>["targets"],
			};
};

export function SshTargetBulkImport({
	isSaving,
	onBulkImportTargets,
}: {
	isSaving: boolean;
	onBulkImportTargets: (input: SshTargetBulkImportInput) => Promise<boolean>;
}) {
	const [authMode, setAuthMode] = useState<SshAuthMode>("key");
	const [importText, setImportText] = useState("");
	const [error, setError] = useState("");
	const [isOpen, setIsOpen] = useState(false);

	const handleImport = async () => {
		setError("");

		try {
			const imported = await onBulkImportTargets(
				parseImportText(authMode, importText),
			);

			if (imported) {
				setImportText("");
				setIsOpen(false);
			}
		} catch (parseError) {
			setError(parseError instanceof Error ? parseError.message : String(parseError));
		}
	};

	return (
		<div className="border-b border-slate-200 bg-slate-50 px-4.5 py-3">
			<button
				type="button"
				className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
				onClick={() => setIsOpen((current) => !current)}
				aria-expanded={isOpen}
			>
				{isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
				Bulk import
			</button>

			{isOpen && (
				<div className="mt-3 grid gap-2.5">
					<div className="flex flex-wrap items-center gap-2">
						<span className="text-xs font-bold text-slate-500 uppercase">
							Auth
						</span>
						<div className="grid h-9 grid-cols-2 overflow-hidden rounded-lg border border-slate-200 bg-white p-0.5">
							<button
								type="button"
								className={`cursor-pointer rounded-md px-3 text-xs font-extrabold ${
									authMode === "key"
										? "bg-blue-600 text-white"
										: "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
								}`}
								onClick={() => setAuthMode("key")}
							>
								Key path
							</button>
							<button
								type="button"
								className={`cursor-pointer rounded-md px-3 text-xs font-extrabold ${
									authMode === "password"
										? "bg-blue-600 text-white"
										: "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
								}`}
								onClick={() => setAuthMode("password")}
							>
								Password
							</button>
						</div>
					</div>
					<textarea
						className="min-h-34 rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs leading-5 text-slate-900 outline-0 focus:border-blue-400"
						value={importText}
						onChange={(event) => setImportText(event.target.value)}
						placeholder={[
							"One target per line:",
							"name,host,port,user," +
								(authMode === "password" ? "password" : "privateKeyPath"),
							sampleRows[authMode],
						].join("\n")}
					/>
					{error && <div className="text-sm font-bold text-rose-700">{error}</div>}
					<div className="flex justify-end">
						<button
							type="button"
							className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-3.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
							onClick={handleImport}
							disabled={isSaving}
						>
							{isSaving ? (
								<LoaderCircle size={15} className="animate-spin" />
							) : (
								<Upload size={15} />
							)}
							Import targets
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
