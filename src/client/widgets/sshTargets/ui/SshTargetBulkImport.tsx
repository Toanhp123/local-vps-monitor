import { useState } from "react";
import { Upload } from "lucide-react";
import type { SshTargetBulkImportInput } from "../../../../shared/types";
import { Button } from "../../../shared/ui/Button";
import { SegmentedControl } from "../../../shared/ui/SegmentedControl";
import type { SshAuthMode } from "../model/useSshTargetForm";

const authModeOptions: Array<{ label: string; value: SshAuthMode }> = [
	{ label: "Key path", value: "key" },
	{ label: "Password", value: "password" },
];

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

	const handleImport = async () => {
		setError("");

		try {
			const imported = await onBulkImportTargets(
				parseImportText(authMode, importText),
			);

			if (imported) {
				setImportText("");
			}
		} catch (parseError) {
			setError(parseError instanceof Error ? parseError.message : String(parseError));
		}
	};

	return (
		<div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-4.5 py-3.5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-xs font-bold text-slate-500 uppercase">
						Auth
					</span>
					<SegmentedControl
						ariaLabel="Bulk import auth mode"
						onChange={setAuthMode}
						options={authModeOptions}
						size="sm"
						value={authMode}
					/>
				</div>
				<span className="text-xs font-semibold text-slate-500">
					name,host,port,user,
					{authMode === "password" ? "password" : "privateKeyPath"}
				</span>
			</div>
			<textarea
				className="min-h-40 rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs leading-5 text-slate-900 outline-0 focus:border-blue-400"
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
				<Button
					onClick={handleImport}
					disabled={isSaving}
					icon={Upload}
					isLoading={isSaving}
					size="lg"
					variant="accent"
				>
					Import targets
				</Button>
			</div>
		</div>
	);
}
