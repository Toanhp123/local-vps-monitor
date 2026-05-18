import type { IncidentEvent } from "@shared/types";
import { groupIncidentsByHour } from "../model/groupIncidentsByTime";
import { relativeTime } from "@/shared/lib/format";

const severityColors: Record<string, string> = {
	critical: "#ef4444",
	warning: "#f59e0b",
	info: "#3b82f6",
	resolved: "#10b981",
};

export function IncidentTimeline({
	incidents,
	now,
}: {
	incidents: IncidentEvent[];
	now: number;
}) {
	if (incidents.length === 0) {
		return (
			<div className="flex min-h-44 items-center justify-center text-sm text-slate-500">
				No incidents to display
			</div>
		);
	}

	const groups = groupIncidentsByHour(incidents);

	return (
		<div className="space-y-6 p-6">
			{groups.map((group) => (
				<div key={group.id}>
					<div className="mb-2 text-xs font-bold text-slate-500">
						{group.label}
					</div>
					<div className="space-y-2">
						{group.incidents.map((incident) => (
							<div
								key={incident.id}
								className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50"
							>
								<div
									className="mt-1 h-2 w-2 shrink-0 rounded-full"
									style={{ backgroundColor: severityColors[incident.severity] }}
								/>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<span className="text-xs font-bold text-slate-500">
											{relativeTime(incident.occurredAt, now)}
										</span>
										<span className="text-xs text-slate-400">&bull;</span>
										<span className="text-sm font-semibold text-slate-900">
											{incident.serverName}
										</span>
										{incident.appName && (
											<>
												<span className="text-xs text-slate-400">&bull;</span>
												<span className="text-sm text-slate-700">
													{incident.appName}
												</span>
											</>
										)}
									</div>
									<p className="mt-1 text-sm text-slate-700">
										{incident.message}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
}
