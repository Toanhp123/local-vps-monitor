import { DataTableHeaderRow } from "@/shared/ui/DataTable";

const columns = [
	{ key: "server", label: "Server" },
	{ key: "status", label: "Status" },
	{ key: "apps", label: "Apps" },
	{ key: "system", label: "System" },
	{ key: "cpu", label: "CPU" },
	{ key: "memory", label: "Memory" },
	{ key: "disk", label: "Disk" },
	{ key: "last-scan", label: "Last scan" },
	{ align: "right" as const, key: "actions", label: "Actions" },
];

export function ServerTableHeader() {
	return <DataTableHeaderRow columns={columns} />;
}
