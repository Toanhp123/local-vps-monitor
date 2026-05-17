import {
	Box,
	HardDrive,
	RefreshCw,
	ShieldCheck,
} from "lucide-react";
import { Button } from "../../../shared/ui/Button";

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
		<section className="mb-4.5 overflow-hidden rounded-lg border border-slate-200 bg-white">
			<div className="flex items-center justify-between gap-3 px-4.5 py-3.5 max-lg:flex-col max-lg:items-stretch">
				<div className="flex min-w-0 items-center gap-2.5">
					<div className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
						<Box size={18} />
					</div>
					<div className="min-w-0">
						<h2 className="text-lg leading-tight font-extrabold text-slate-900">
							Local Docker
						</h2>
						<div className="mt-1 flex flex-wrap gap-1.5">
							<span className="inline-flex min-h-6 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-xs font-extrabold text-slate-700">
								<HardDrive size={14} />
								This machine
							</span>
							<span className="inline-flex min-h-6 items-center gap-1.5 rounded-full bg-green-100 px-2.5 text-xs font-extrabold text-green-800">
								<ShieldCheck size={14} />
								Local only
							</span>
						</div>
					</div>
				</div>
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
			</div>
		</section>
	);
}
