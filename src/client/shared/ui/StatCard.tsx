import type { LucideIcon } from "lucide-react";

const iconClasses: Record<string, string> = {
	default: "bg-blue-50 text-blue-600",
	ok: "bg-green-100 text-green-700",
	warn: "bg-amber-100 text-amber-700",
	bad: "bg-red-100 text-red-700",
};

export function StatCard({
	label,
	value,
	tone,
	icon: Icon,
}: {
	label: string;
	value: string | number;
	tone?: string;
	icon: LucideIcon;
}) {
	return (
		<div className="flex min-h-21.5 items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
			<div
				className={`flex h-9.5 w-9.5 items-center justify-center rounded-lg ${iconClasses[tone || "default"]}`}
			>
				<Icon size={18} />
			</div>
			<div>
				<span className="block text-[13px] font-bold text-slate-500">
					{label}
				</span>
				<strong className="mt-1 block text-2xl font-extrabold text-slate-900">
					{value}
				</strong>
			</div>
		</div>
	);
}
