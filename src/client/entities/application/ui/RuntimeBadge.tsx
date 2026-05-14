import { Box, SquareTerminal } from "lucide-react";
import type { AppKind } from "../../../../shared/types";

export function RuntimeBadge({ kind }: { kind: AppKind }) {
	const Icon = kind === "docker" ? Box : SquareTerminal;
	const classes =
		kind === "docker"
			? "bg-blue-100 text-blue-700"
			: "bg-violet-100 text-violet-700";

	return (
		<span
			className={`inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-extrabold leading-none align-middle ${classes}`}
		>
			<Icon size={14} />
			{kind.toUpperCase()}
		</span>
	);
}
