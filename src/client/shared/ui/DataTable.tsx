import type {
	HTMLAttributes,
	ReactNode,
	TdHTMLAttributes,
	ThHTMLAttributes,
} from "react";

type DataTableAlign = "center" | "left" | "right";
type DataTableBorder = "bottom" | "none" | "top";
type DataTableHeaderTone = "subtle" | "white";

interface DataTableColumn {
	align?: DataTableAlign;
	className?: string;
	key: string;
	label: ReactNode;
	stickyRight?: boolean;
}

const actionDividerClass =
	"before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-300 before:content-['']";

const alignClasses: Record<DataTableAlign, string> = {
	center: "text-center",
	left: "text-left",
	right: "text-right",
};

const borderClasses: Record<DataTableBorder, string> = {
	bottom: "border-b",
	none: "",
	top: "border-t",
};

const headerToneClasses: Record<DataTableHeaderTone, string> = {
	subtle: "bg-slate-50",
	white: "bg-white",
};

export function DataTable({
	children,
	className = "",
	minWidth = "min-w-250",
}: {
	children: ReactNode;
	className?: string;
	minWidth?: string;
}) {
	return (
		<div className="overflow-x-auto">
			<table className={`w-full border-collapse ${minWidth} ${className}`}>
				{children}
			</table>
		</div>
	);
}

export function DataTableHeader({ children }: { children: ReactNode }) {
	return (
		<thead>
			<tr>{children}</tr>
		</thead>
	);
}

export function DataTableHeaderRow({
	border,
	columns,
	tone,
}: {
	border?: DataTableBorder;
	columns: DataTableColumn[];
	tone?: DataTableHeaderTone;
}) {
	return (
		<DataTableHeader>
			{columns.map((column) => (
				<DataTableHeaderCell
					key={column.key}
					align={column.align}
					border={border}
					className={`${column.stickyRight ? `${actionDividerClass} sticky right-0 z-20 min-w-36 ${headerToneClasses[tone ?? "white"]}` : ""} ${column.className ?? ""}`}
					tone={tone}
				>
					{column.label}
				</DataTableHeaderCell>
			))}
		</DataTableHeader>
	);
}

export function DataTableBody({ children }: { children: ReactNode }) {
	return <tbody>{children}</tbody>;
}

export function DataTableRow({
	children,
	className = "",
	...props
}: HTMLAttributes<HTMLTableRowElement> & {
	children: ReactNode;
}) {
	return (
		<tr className={className} {...props}>
			{children}
		</tr>
	);
}

export function DataTableHeaderCell({
	align = "left",
	border = "bottom",
	children,
	className = "",
	tone = "white",
	...props
}: ThHTMLAttributes<HTMLTableCellElement> & {
	align?: DataTableAlign;
	border?: DataTableBorder;
	children: ReactNode;
	tone?: DataTableHeaderTone;
}) {
	return (
		<th
			className={`${borderClasses[border]} border-slate-200 ${headerToneClasses[tone]} px-3.5 py-3 align-middle text-xs font-bold text-slate-500 uppercase whitespace-nowrap ${alignClasses[align]} ${className}`}
			{...props}
		>
			{children}
		</th>
	);
}

export function DataTableCell({
	align = "left",
	border = "bottom",
	children,
	className = "",
	noWrap = true,
	...props
}: TdHTMLAttributes<HTMLTableCellElement> & {
	align?: DataTableAlign;
	border?: DataTableBorder;
	children: ReactNode;
	noWrap?: boolean;
}) {
	return (
		<td
			className={`${borderClasses[border]} border-slate-200 px-3.5 py-3 align-middle ${alignClasses[align]} ${
				noWrap ? "whitespace-nowrap" : ""
			} ${className}`}
			{...props}
		>
			{children}
		</td>
	);
}

export function DataTableTitle({
	afterTitle,
	className = "",
	leading,
	subtitle,
	subtitleClassName = "",
	title,
	titleClassName = "",
}: {
	afterTitle?: ReactNode;
	className?: string;
	leading?: ReactNode;
	subtitle?: ReactNode;
	subtitleClassName?: string;
	title: ReactNode;
	titleClassName?: string;
}) {
	return (
		<div className={`flex min-w-0 items-center gap-2.5 ${className}`}>
			{leading}
			<span className="min-w-0">
				<span className="flex min-w-0 items-center gap-2">
					<strong
						className={`block overflow-hidden text-ellipsis text-slate-900 ${titleClassName}`}
					>
						{title}
					</strong>
					{afterTitle}
				</span>
				{subtitle && (
					<span
						className={`block overflow-hidden text-ellipsis text-xs font-semibold text-slate-500 ${subtitleClassName}`}
					>
						{subtitle}
					</span>
				)}
			</span>
		</div>
	);
}

export function DataTableActions({
	children,
	className = "",
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={`flex items-center justify-end gap-2 ${className}`}>
			{children}
		</div>
	);
}

export function DataTableActionsCell({
	border,
	children,
	className = "",
	sticky = false,
}: {
	border?: DataTableBorder;
	children: ReactNode;
	className?: string;
	sticky?: boolean;
}) {
	return (
		<DataTableCell
			align="right"
			border={border}
			className={`${sticky ? `${actionDividerClass} sticky right-0 z-10 min-w-36 bg-slate-50` : ""} ${className}`}
		>
			<DataTableActions>{children}</DataTableActions>
		</DataTableCell>
	);
}

export function DataTableMessageRow({
	align = "center",
	border = "bottom",
	children,
	className = "",
	colSpan,
}: {
	align?: DataTableAlign;
	border?: DataTableBorder;
	children: ReactNode;
	className?: string;
	colSpan: number;
}) {
	return (
		<tr>
			<td
				colSpan={colSpan}
				className={`h-18 ${borderClasses[border]} border-slate-200 px-3.5 py-3 font-semibold text-slate-500 ${alignClasses[align]} ${className}`}
			>
				{children}
			</td>
		</tr>
	);
}
