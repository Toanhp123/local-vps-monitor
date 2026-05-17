import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";

type SegmentedControlSize = "md" | "sm";
type SegmentedControlTone = "blue" | "dark";

const sizeClasses: Record<
	SegmentedControlSize,
	{ icon: number; root: string; tab: string }
> = {
	md: {
		icon: 16,
		root: "h-10",
		tab: "gap-2 px-4 text-sm",
	},
	sm: {
		icon: 14,
		root: "h-9",
		tab: "gap-1.5 px-3 text-xs",
	},
};

const selectedClasses: Record<SegmentedControlTone, string> = {
	blue: "bg-blue-600 text-white",
	dark: "bg-slate-900 text-white",
};

export function SegmentedControl<TValue extends string>({
	ariaLabel,
	className = "",
	onChange,
	options,
	size = "md",
	tone = "blue",
	value,
}: {
	ariaLabel: string;
	className?: string;
	onChange: (value: TValue) => void;
	options: Array<{
		icon?: LucideIcon;
		label: string;
		value: TValue;
	}>;
	size?: SegmentedControlSize;
	tone?: SegmentedControlTone;
	value: TValue;
}) {
	const classes = sizeClasses[size];
	const style: CSSProperties = {
		gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
	};

	return (
		<div
			className={`inline-grid overflow-hidden rounded-lg border border-slate-200 bg-white p-0.5 ${classes.root} ${className}`}
			role="group"
			aria-label={ariaLabel}
			style={style}
		>
			{options.map((option) => {
				const Icon = option.icon;
				const isSelected = option.value === value;

				return (
					<button
						key={option.value}
						type="button"
						className={`inline-flex cursor-pointer items-center justify-center rounded-md font-extrabold ${
							classes.tab
						} ${
							isSelected
								? selectedClasses[tone]
								: "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
						}`}
						onClick={() => onChange(option.value)}
						aria-pressed={isSelected}
					>
						{Icon && <Icon size={classes.icon} />}
						{option.label}
					</button>
				);
			})}
		</div>
	);
}
