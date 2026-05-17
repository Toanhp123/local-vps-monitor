import { FileText } from "lucide-react";
import { Button } from "../../../shared/ui/Button";

export function OpenAppLogsButton({ onOpen }: { onOpen: () => void }) {
	return (
		<Button
			onClick={onOpen}
			icon={FileText}
			size="sm"
		>
			Logs
		</Button>
	);
}
