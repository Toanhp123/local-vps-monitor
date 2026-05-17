import type {
	HTMLAttributes,
	ReactNode,
	TdHTMLAttributes,
	ThHTMLAttributes,
} from "react";

type DataTableAlign = "center" | "left" | "right";
type DataTableBorder = "bottom" | "none" | "top";
type DataTableHeaderTone = "subtle" | "white";

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
