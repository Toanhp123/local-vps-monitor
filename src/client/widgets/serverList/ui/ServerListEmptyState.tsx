import { Server } from "lucide-react";

export function ServerListEmptyState({ title }: { title: string }) {
	return (
		<div className="flex min-h-45 flex-col items-center justify-center gap-2.5 border-dashed border-slate-300 bg-slate-50 text-slate-500">
			<Server size={28} />
			<strong>{title}</strong>
		</div>
	);
}
