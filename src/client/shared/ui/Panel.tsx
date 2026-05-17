import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function Panel({
	children,
	className = "",
	id,
}: {
	children: ReactNode;
	className?: string;
	id?: string;
}) {
	return (
		<section
			id={id}
			className={`overflow-hidden rounded-lg border border-slate-200 bg-white ${className}`}
		>
			{children}
		</section>
	);
}

export function PanelHeader({
	actions,
	badges,
	bordered = true,
	description,
	icon: Icon,
	iconClassName = "bg-blue-50 text-blue-600",
	title,
}: {
	actions?: ReactNode;
	badges?: ReactNode;
	bordered?: boolean;
	description?: ReactNode;
	icon?: LucideIcon;
	iconClassName?: string;
	title: ReactNode;
}) {
	return (
		<div
			className={`flex items-center justify-between gap-3 px-4.5 py-3.5 max-lg:flex-col max-lg:items-stretch ${
				bordered ? "border-b border-slate-200" : ""
			}`}
		>
			<div className="flex min-w-0 items-center gap-2.5">
				{Icon && (
					<div
						className={`flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
					>
						<Icon size={18} />
					</div>
				)}
				<div className="min-w-0">
					<h2 className="text-lg leading-tight font-extrabold text-slate-900">
						{title}
					</h2>
					{description && (
						<p className="mt-1 text-sm font-semibold text-slate-500">
							{description}
						</p>
					)}
					{badges && (
						<div className="mt-1 flex flex-wrap gap-1.5">{badges}</div>
					)}
				</div>
			</div>
			{actions}
		</div>
	);
}

export function PanelError({
	children,
	className = "",
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`border-b border-slate-200 px-4.5 py-3 text-sm font-bold text-rose-700 ${className}`}
		>
			{children}
		</div>
	);
}
