import { FileText } from "lucide-react";

export function OpenAppLogsButton({ onOpen }: { onOpen: () => void }) {
	return (
		<button
			type="button"
			className="inline-flex min-h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
			onClick={onOpen}
		>
			<FileText size={14} />
			Logs
		</button>
	);
}
