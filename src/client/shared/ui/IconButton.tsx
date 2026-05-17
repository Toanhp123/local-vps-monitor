import { forwardRef, type ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

type IconButtonSize = "md" | "sm";
type IconButtonVariant = "danger" | "secondary";

const sizeClasses: Record<IconButtonSize, string> = {
	md: "h-9 w-9",
	sm: "h-8 w-8",
};

const iconSizes: Record<IconButtonSize, number> = {
	md: 16,
	sm: 15,
};

const variantClasses: Record<IconButtonVariant, string> = {
	danger:
		"border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700",
	secondary:
		"border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700",
};

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
	"aria-label": string;
	icon: LucideIcon;
	size?: IconButtonSize;
	variant?: IconButtonVariant;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({
	"aria-label": ariaLabel,
	className = "",
	icon: Icon,
	size = "md",
	type = "button",
	variant = "secondary",
	...props
}, ref) {
	return (
		<button
			ref={ref}
			type={type}
			aria-label={ariaLabel}
			className={`inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border disabled:cursor-not-allowed disabled:opacity-60 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
			{...props}
		>
			<Icon size={iconSizes[size]} />
		</button>
	);
});
