import {
	DataTableHeader,
	DataTableHeaderCell,
} from "../../../shared/ui/DataTable";

export function ServerTableHeader() {
	return (
		<DataTableHeader>
			<DataTableHeaderCell>Server</DataTableHeaderCell>
			<DataTableHeaderCell>Status</DataTableHeaderCell>
			<DataTableHeaderCell>Apps</DataTableHeaderCell>
			<DataTableHeaderCell>System</DataTableHeaderCell>
			<DataTableHeaderCell>CPU</DataTableHeaderCell>
			<DataTableHeaderCell>Memory</DataTableHeaderCell>
			<DataTableHeaderCell>Disk</DataTableHeaderCell>
			<DataTableHeaderCell>Last scan</DataTableHeaderCell>
			<DataTableHeaderCell align="right">Actions</DataTableHeaderCell>
		</DataTableHeader>
	);
}
