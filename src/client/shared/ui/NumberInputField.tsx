import type { InputHTMLAttributes, ReactNode } from "react";

export function NumberInputField({
	"aria-label": ariaLabel,
	className = "",
	disabled,
	label,
	labelClassName,
	max,
	min,
	onChange,
	placeholder,
	required = false,
	size = "md",
	step = 1,
	unit,
	value,
}: {
	"aria-label"?: string;
	className?: string;
	disabled?: boolean;
	label: ReactNode;
	labelClassName?: string;
	max?: number;
	min?: number;
	onChange: (value: string) => void;
	placeholder?: string;
	required?: boolean;
	size?: "md" | "sm";
	step?: number;
	unit?: string;
	value: string;
}) {
	const inputPadding = size === "sm" ? "px-2.5" : "px-3";
	const labelClass =
		labelClassName ??
		(size === "sm"
			? "text-[11px] font-bold text-slate-500 uppercase"
			: "text-xs font-bold text-slate-500 uppercase");
	const minHeight = size === "sm" ? "min-h-9" : "min-h-10";
	const inputMode: InputHTMLAttributes<HTMLInputElement>["inputMode"] =
		step % 1 === 0 ? "numeric" : "decimal";

	return (
		<label className={`grid min-w-0 gap-1.5 ${className}`}>
			<span className={labelClass}>{label}</span>
			<span
				className={`grid ${minHeight} ${
					unit ? "grid-cols-[minmax(0,1fr)_auto]" : ""
				} overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-blue-300`}
			>
				<input
					aria-label={ariaLabel}
					className={`min-w-0 border-0 bg-transparent ${inputPadding} text-sm font-bold text-slate-900 outline-0 disabled:text-slate-400`}
					disabled={disabled}
					inputMode={inputMode}
					max={max}
					min={min}
					onChange={(event) => onChange(event.target.value)}
					placeholder={placeholder}
					required={required}
					step={step}
					type="number"
					value={value}
				/>
				{unit && (
					<span className="flex items-center border-l border-slate-200 bg-slate-50 px-2.5 text-xs font-extrabold text-slate-500">
						{unit}
					</span>
				)}
			</span>
		</label>
	);
}
