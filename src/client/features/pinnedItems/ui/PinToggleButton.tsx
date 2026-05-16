import { Star } from "lucide-react";

export function PinToggleButton({
	ariaLabel,
	isPinned,
	onToggle,
}: {
	ariaLabel: string;
	isPinned: boolean;
	onToggle: () => void;
}) {
	return (
		<button
			type="button"
			className={`inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors ${
				isPinned
					? "border-amber-200 bg-amber-50 text-amber-500 hover:bg-amber-100"
					: "border-slate-200 bg-white text-slate-400 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-500"
			}`}
			onClick={(event) => {
				event.stopPropagation();
				onToggle();
			}}
			aria-label={ariaLabel}
			aria-pressed={isPinned}
			title={ariaLabel}
		>
			<Star
				size={16}
				className={isPinned ? "fill-current" : "fill-transparent"}
			/>
		</button>
	);
}
