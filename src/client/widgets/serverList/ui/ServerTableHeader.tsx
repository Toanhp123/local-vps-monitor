const headerCellClass =
	"border-b border-slate-200 bg-white px-3.5 py-3 text-left text-xs font-bold uppercase text-slate-500 whitespace-nowrap";

export function ServerTableHeader() {
	return (
		<thead>
			<tr>
				<th className={headerCellClass}>VPS</th>
				<th className={headerCellClass}>Status</th>
				<th className={headerCellClass}>Apps</th>
				<th className={headerCellClass}>System</th>
				<th className={headerCellClass}>CPU</th>
				<th className={headerCellClass}>Memory</th>
				<th className={headerCellClass}>Last scan</th>
				<th className={`${headerCellClass} text-right`}>Actions</th>
			</tr>
		</thead>
	);
}
