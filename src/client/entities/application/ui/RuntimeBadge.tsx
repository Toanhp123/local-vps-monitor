import { Box, SquareTerminal } from "lucide-react";
import type { AppKind } from "@shared/types";
import { Badge } from "@/shared/ui/Badge";

export function RuntimeBadge({ kind }: { kind: AppKind }) {
	const Icon = kind === "docker" ? Box : SquareTerminal;
	const tone = kind === "docker" ? "blueStrong" : "violetStrong";

	return (
		<Badge icon={Icon} tone={tone}>
			{kind.toUpperCase()}
		</Badge>
	);
}
