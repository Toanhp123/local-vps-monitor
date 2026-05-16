import {
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export interface SelectFieldOption {
	description?: string;
	disabled?: boolean;
	label: string;
	value: string;
}

const viewportPadding = 8;

const defaultButtonClass =
	"inline-flex min-h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-sm font-bold text-slate-800 outline-0 hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60";

const optionClass = (isSelected: boolean, isDisabled: boolean) => {
	if (isDisabled) {
		return "cursor-not-allowed text-slate-300";
	}

	return isSelected
		? "bg-blue-50 text-blue-700"
		: "text-slate-700 hover:bg-slate-50";
};

export function SelectField({
	ariaLabel,
	buttonClassName = defaultButtonClass,
	disabled = false,
	leadingIcon,
	onChange,
	options,
	placeholder = "Select",
	value,
}: {
	ariaLabel: string;
	buttonClassName?: string;
	disabled?: boolean;
	leadingIcon?: ReactNode;
	onChange: (value: string) => void;
	options: SelectFieldOption[];
	placeholder?: string;
	value: string;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [position, setPosition] = useState({ left: 0, top: 0, width: 0 });
	const buttonRef = useRef<HTMLButtonElement | null>(null);
	const menuRef = useRef<HTMLDivElement | null>(null);
	const selectedOption = options.find((option) => option.value === value);

	const close = () => setIsOpen(false);
	const updatePosition = () => {
		const rect = buttonRef.current?.getBoundingClientRect();
		if (!rect) return;

		const menuHeight = menuRef.current?.offsetHeight || 220;
		const belowTop = rect.bottom + 6;
		const aboveTop = rect.top - menuHeight - 6;
		const hasRoomBelow =
			belowTop + menuHeight <= window.innerHeight - viewportPadding;
		const preferredTop = hasRoomBelow ? belowTop : aboveTop;
		const maxTop = Math.max(
			viewportPadding,
			window.innerHeight - menuHeight - viewportPadding,
		);
		const maxLeft = Math.max(
			viewportPadding,
			window.innerWidth - rect.width - viewportPadding,
		);

		setPosition({
			left: Math.min(Math.max(viewportPadding, rect.left), maxLeft),
			top: Math.min(Math.max(viewportPadding, preferredTop), maxTop),
			width: rect.width,
		});
	};

	useLayoutEffect(() => {
		if (!isOpen) return;

		updatePosition();
	}, [isOpen, options.length]);

	useEffect(() => {
		if (!isOpen) return undefined;

		updatePosition();

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target as Node;
			if (
				buttonRef.current?.contains(target) ||
				menuRef.current?.contains(target)
			) {
				return;
			}

			close();
		};
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") close();
		};

		window.addEventListener("pointerdown", handlePointerDown);
		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("resize", updatePosition);
		window.addEventListener("scroll", updatePosition, true);

		return () => {
			window.removeEventListener("pointerdown", handlePointerDown);
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("resize", updatePosition);
			window.removeEventListener("scroll", updatePosition, true);
		};
	}, [isOpen]);

	return (
		<>
			<button
				ref={buttonRef}
				type="button"
				className={buttonClassName}
				disabled={disabled}
				onClick={() => setIsOpen((current) => !current)}
				aria-expanded={isOpen}
				aria-haspopup="listbox"
				aria-label={ariaLabel}
			>
				<span className="flex min-w-0 items-center gap-2">
					{leadingIcon}
					<span className="min-w-0 truncate">
						{selectedOption?.label || placeholder}
					</span>
				</span>
				<ChevronDown
					size={15}
					className={`shrink-0 text-slate-400 transition-transform ${
						isOpen ? "rotate-180" : ""
					}`}
				/>
			</button>

			{isOpen &&
				createPortal(
					<div
						ref={menuRef}
						className="fixed z-60 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl shadow-slate-950/15"
						role="listbox"
						style={{
							left: position.left,
							top: position.top,
							width: position.width,
						}}
					>
						{options.map((option) => {
							const isSelected = option.value === value;

							return (
								<button
									key={option.value}
									type="button"
									className={`flex min-h-9 w-full cursor-pointer items-center justify-between gap-2 px-3 text-left text-sm font-bold ${optionClass(
										isSelected,
										Boolean(option.disabled),
									)}`}
									disabled={option.disabled}
									onClick={() => {
										onChange(option.value);
										close();
									}}
									role="option"
									aria-selected={isSelected}
								>
									<span className="min-w-0">
										<span className="block truncate">
											{option.label}
										</span>
										{option.description && (
											<span className="mt-0.5 block truncate text-xs font-semibold text-slate-400">
												{option.description}
											</span>
										)}
									</span>
									{isSelected && <Check size={15} />}
								</button>
							);
						})}
					</div>,
					document.body,
				)}
		</>
	);
}
