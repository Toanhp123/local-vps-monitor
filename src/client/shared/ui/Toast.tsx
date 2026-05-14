import { AlertTriangle, CheckCircle2 } from "lucide-react";

export interface ToastState {
	message: string;
	tone: "success" | "error";
}

export function Toast({ toast }: { toast: ToastState | null }) {
	if (!toast) return null;

	const Icon = toast.tone === "success" ? CheckCircle2 : AlertTriangle;
	const classes =
		toast.tone === "success"
			? "border-green-200 bg-white text-green-800"
			: "border-rose-200 bg-white text-rose-800";

	return (
		<div className="fixed right-5 bottom-5 z-50 max-w-120 max-md:right-4 max-md:bottom-4 max-md:left-4">
			<div
				className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm font-bold shadow-lg shadow-slate-200/80 ${classes}`}
				role="status"
			>
				<Icon size={18} className="mt-0.5 shrink-0" />
				<span className="min-w-0 break-words">{toast.message}</span>
			</div>
		</div>
	);
}
