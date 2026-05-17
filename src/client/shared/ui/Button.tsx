import {
	LoaderCircle,
	type LucideIcon,
} from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonSize = "lg" | "md" | "sm";
type ButtonVariant = "accent" | "danger" | "dangerSoft" | "primary" | "secondary";

const sizeClasses: Record<ButtonSize, string> = {
	lg: "min-h-10 px-3.5 text-sm",
	md: "min-h-9 px-3 text-sm",
	sm: "min-h-8 px-2.5 text-xs",
};

const gapClasses: Record<ButtonSize, string> = {
	lg: "gap-2",
	md: "gap-2",
	sm: "gap-1.5",
};

const iconSizes: Record<ButtonSize, number> = {
	lg: 16,
	md: 15,
	sm: 14,
};

const variantClasses: Record<ButtonVariant, string> = {
	accent: "border-blue-600 bg-blue-600 text-white hover:bg-blue-700",
	danger: "border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
	dangerSoft: "border-rose-200 bg-rose-50 text-rose-700",
	primary: "border-slate-900 bg-slate-900 text-white hover:bg-slate-700",
	secondary:
		"border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	children: ReactNode;
	icon?: LucideIcon;
	isLoading?: boolean;
	size?: ButtonSize;
	variant?: ButtonVariant;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
	children,
	className = "",
	icon: Icon,
	isLoading = false,
	size = "md",
	type = "button",
	variant = "secondary",
	...props
}, ref) {
	const iconSize = iconSizes[size];

	return (
		<button
			ref={ref}
			type={type}
			className={`inline-flex cursor-pointer items-center justify-center rounded-lg border font-bold disabled:cursor-not-allowed disabled:opacity-60 ${gapClasses[size]} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
			{...props}
		>
			{isLoading ? (
				<LoaderCircle size={iconSize} className="animate-spin" />
			) : Icon ? (
				<Icon size={iconSize} />
			) : null}
			{children}
		</button>
	);
});
