import {
	Box,
	HardDrive,
	RefreshCw,
	ShieldCheck,
} from "lucide-react";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Panel, PanelHeader } from "@/shared/ui/Panel";

export function LocalDockerPanel({
	isScanDisabled,
	isScanning,
	onScan,
}: {
	isScanDisabled: boolean;
	isScanning: boolean;
	onScan: () => void;
}) {
	return (
		<Panel className="mb-4.5">
			<PanelHeader
				badges={
					<>
						<Badge icon={HardDrive}>This machine</Badge>
						<Badge icon={ShieldCheck} tone="green">
							Local only
						</Badge>
					</>
				}
				bordered={false}
				icon={Box}
				iconClassName="bg-cyan-50 text-cyan-700"
				title="Local Docker"
				actions={
					<Button
						onClick={onScan}
						disabled={isScanDisabled}
						icon={RefreshCw}
						isLoading={isScanning}
						size="lg"
						variant="primary"
					>
						{isScanning ? "Scanning" : "Scan Docker"}
					</Button>
				}
			/>
		</Panel>
	);
}
