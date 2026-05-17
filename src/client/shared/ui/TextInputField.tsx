import type { HTMLInputAutoCompleteAttribute, ReactNode } from "react";

type TextInputType = "email" | "password" | "search" | "tel" | "text" | "url";

export function TextInputField({
	autoComplete,
	className = "",
	disabled,
	helper,
	inputClassName = "",
	label,
	labelClassName,
	maxLength,
	onChange,
	placeholder,
	required = false,
	size = "md",
	type = "text",
	value,
}: {
	autoComplete?: HTMLInputAutoCompleteAttribute;
	className?: string;
	disabled?: boolean;
	helper?: ReactNode;
	inputClassName?: string;
	label: ReactNode;
	labelClassName?: string;
	maxLength?: number;
	onChange: (value: string) => void;
	placeholder?: string;
	required?: boolean;
	size?: "md" | "sm";
	type?: TextInputType;
	value: string;
}) {
	const inputPadding = size === "sm" ? "px-2.5" : "px-3";
	const labelClass =
		labelClassName ??
		(size === "sm"
			? "text-[11px] font-bold text-slate-500 uppercase"
			: "text-xs font-bold text-slate-500 uppercase");
	const minHeight = size === "sm" ? "min-h-9" : "min-h-10";

	return (
		<label className={`grid min-w-0 gap-1.5 ${className}`}>
			<span className={labelClass}>{label}</span>
			<input
				autoComplete={autoComplete}
				className={`${minHeight} min-w-0 rounded-lg border border-slate-200 bg-white ${inputPadding} text-sm font-bold text-slate-900 outline-0 focus:border-blue-300 disabled:text-slate-400 ${inputClassName}`}
				disabled={disabled}
				maxLength={maxLength}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				required={required}
				type={type}
				value={value}
			/>
			{helper && (
				<span className="text-xs leading-4 font-semibold text-slate-400">
					{helper}
				</span>
			)}
		</label>
	);
}
