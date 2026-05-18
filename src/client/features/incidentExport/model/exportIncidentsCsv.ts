import type { IncidentEvent } from "@shared/types";

export const exportIncidentsToCsv = (incidents: IncidentEvent[]): void => {
	const headers = [
		"Time",
		"Server",
		"App",
		"Kind",
		"Severity",
		"Message",
		"Current Health",
		"Previous Health",
	];

	const rows = incidents.map((incident) => [
		incident.occurredAt,
		incident.serverName,
		incident.appName || "",
		incident.kind,
		incident.severity,
		incident.message,
		incident.currentHealth || "",
		incident.previousHealth || "",
	]);

	const csvContent = [
		headers.join(","),
		...rows.map((row) =>
			row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
		),
	].join("\n");

	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `incidents-${new Date().toISOString().slice(0, 10)}.csv`;
	link.click();
	URL.revokeObjectURL(url);
};
