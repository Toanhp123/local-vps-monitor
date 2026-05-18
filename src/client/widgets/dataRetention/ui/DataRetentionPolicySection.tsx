import { CalendarDays, Power } from "lucide-react";
import type { DataRetentionSettings } from "@shared/types";
import { Badge } from "@/shared/ui/Badge";
import { NumberInputField } from "@/shared/ui/NumberInputField";
import { retentionDaysFromInput } from "../model/dataRetentionPanelModel";

export function DataRetentionPolicySection({
	form,
	onChange,
}: {
	form: DataRetentionSettings;
	onChange: (form: DataRetentionSettings) => void;
}) {
	return (
		<div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
			<div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
				<CalendarDays size={15} />
				Retention Policy
			</div>
			<label className="mb-3 flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-3">
				<span className="flex min-w-0 items-center gap-2.5">
					<span
						className={`flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg ${
							form.dataRetentionEnabled
								? "bg-green-100 text-green-700"
								: "bg-slate-100 text-slate-500"
						}`}
					>
						<Power size={16} />
					</span>
					<span className="min-w-0">
						<span className="block text-sm font-extrabold text-slate-900">
							Automatic cleanup
						</span>
						<span className="mt-0.5 block text-xs font-semibold text-slate-500">
							Run retention cleanup on a daily schedule.
						</span>
					</span>
				</span>
				<span className="flex shrink-0 items-center gap-2">
					<Badge tone={form.dataRetentionEnabled ? "green" : "gray"}>
						{form.dataRetentionEnabled ? "Enabled" : "Disabled"}
					</Badge>
					<input
						type="checkbox"
						checked={form.dataRetentionEnabled}
						onChange={(event) =>
							onChange({
								...form,
								dataRetentionEnabled: event.target.checked,
							})
						}
						className="h-4 w-4 rounded border-slate-300"
					/>
				</span>
			</label>
			<div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
				<NumberInputField
					label="Metrics retention"
					value={String(form.metricsRetentionDays)}
					onChange={(value) =>
						onChange({
							...form,
							metricsRetentionDays: retentionDaysFromInput(value),
						})
					}
					min={1}
					max={365}
					unit="days"
				/>
				<NumberInputField
					label="Incidents retention"
					value={String(form.incidentsRetentionDays)}
					onChange={(value) =>
						onChange({
							...form,
							incidentsRetentionDays: retentionDaysFromInput(value),
						})
					}
					min={1}
					max={365}
					unit="days"
				/>
			</div>
		</div>
	);
}
