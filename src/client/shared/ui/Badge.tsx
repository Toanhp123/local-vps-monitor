import type { HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type BadgeSize = "lg" | "md" | "sm" | "xs";
type BadgeTone =
	| "amber"
	| "blue"
	| "blueStrong"
	| "emerald"
	| "gray"
	| "green"
	| "red"
	| "rose"
	| "slate"
	| "violet"
	| "violetStrong"
	| "white";

const sizeClasses: Record<BadgeSize, string> = {
	lg: "min-h-8 px-3 text-sm",
	md: "min-h-7 px-2.5 text-xs",
	sm: "min-h-6 px-2.5 text-xs",
	xs: "min-h-5 px-2 text-[10px]",
};

const iconSizes: Record<BadgeSize, number> = {
	lg: 15,
	md: 14,
	sm: 14,
	xs: 12,
};

const toneClasses: Record<BadgeTone, string> = {
	amber: "bg-amber-100 text-amber-800",
	blue: "bg-blue-50 text-blue-700",
	blueStrong: "bg-blue-100 text-blue-700",
	emerald: "bg-emerald-50 text-emerald-700",
	gray: "bg-gray-200 text-gray-700",
	green: "bg-green-100 text-green-800",
	red: "bg-red-100 text-red-800",
	rose: "bg-rose-100 text-rose-700",
	slate: "bg-slate-100 text-slate-700",
	violet: "bg-violet-50 text-violet-700",
	violetStrong: "bg-violet-100 text-violet-700",
	white: "bg-white text-slate-600",
};

export function Badge({
	children,
	className = "",
	icon: Icon,
	size = "sm",
	tone = "slate",
	...props
}: HTMLAttributes<HTMLSpanElement> & {
	children: ReactNode;
	className?: string;
	icon?: LucideIcon;
	size?: BadgeSize;
	tone?: BadgeTone;
}) {
	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-full font-extrabold leading-none align-middle ${sizeClasses[size]} ${toneClasses[tone]} ${className}`}
			{...props}
		>
			{Icon && <Icon size={iconSizes[size]} />}
			{children}
		</span>
	);
}
