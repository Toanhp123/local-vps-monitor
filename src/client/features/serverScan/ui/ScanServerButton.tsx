import { RefreshCw } from "lucide-react";
import { Button } from "../../../shared/ui/Button";

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
	variant?: "primary" | "secondary";
}) {
	return (
		<Button
			onClick={(event) => {
				event.stopPropagation();
				onScan();
			}}
			disabled={isDisabled}
			aria-label={ariaLabel}
			icon={RefreshCw}
			isLoading={isScanning}
			variant={variant}
		>
			{isScanning ? scanningLabel : label}
		</Button>
	);
}
