import { Search, X } from "lucide-react";

const sizeClasses = {
	md: {
		icon: 16,
		root: "h-10 min-w-72.5 px-3",
		text: "text-sm",
		x: 15,
	},
	sm: {
		icon: 15,
		root: "h-9 min-w-60 px-2.5",
		text: "text-sm font-semibold",
		x: 14,
	},
};

export function SearchInput({
	ariaLabel,
	className = "",
	onChange,
	placeholder,
	size = "md",
	value,
}: {
	ariaLabel: string;
	className?: string;
	onChange: (value: string) => void;
	placeholder: string;
	size?: keyof typeof sizeClasses;
	value: string;
}) {
	const classes = sizeClasses[size];

	return (
		<label
			className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white text-slate-500 ${classes.root} ${className}`}
		>
			<Search size={classes.icon} />
			<input
				aria-label={ariaLabel}
				className={`w-full min-w-0 border-0 text-slate-900 outline-0 ${classes.text}`}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
			/>
			{value && (
				<button
					type="button"
					className="cursor-pointer text-slate-400 hover:text-slate-700"
					onClick={() => onChange("")}
					aria-label={`Clear ${ariaLabel}`}
				>
					<X size={classes.x} />
				</button>
			)}
		</label>
	);
}
