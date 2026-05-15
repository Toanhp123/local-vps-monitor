import { LoaderCircle, RefreshCw } from "lucide-react";

const variantClasses = {
	primary:
		"border-slate-900 bg-slate-900 text-white hover:bg-slate-700",
	secondary:
		"border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700",
};

export function ScanServerButton({
	ariaLabel,
	isDisabled,
	isScanning,
	label = "Scan",
	onScan,
	scanningLabel = "Scanning",
	variant = "secondary",
}: {
	ariaLabel: string;
	isDisabled: boolean;
	isScanning: boolean;
	label?: string;
	onScan: () => void;
	scanningLabel?: string;
	variant?: keyof typeof variantClasses;
}) {
	return (
		<button
			type="button"
			className={`inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]}`}
			onClick={(event) => {
				event.stopPropagation();
				onScan();
			}}
			disabled={isDisabled}
			aria-label={ariaLabel}
		>
			{isScanning ? (
				<LoaderCircle size={15} className="animate-spin" />
			) : (
				<RefreshCw size={15} />
			)}
			{isScanning ? scanningLabel : label}
		</button>
	);
}
