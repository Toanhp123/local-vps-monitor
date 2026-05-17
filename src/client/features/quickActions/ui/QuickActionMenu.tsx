import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
	MoreHorizontal,
	Play,
	RotateCcw,
	Square,
	Terminal,
	type LucideIcon,
} from "lucide-react";
import { IconButton } from "../../../shared/ui/IconButton";
import type { QuickActionDefinition } from "../model/quickActions";

const actionIcons: Partial<Record<string, LucideIcon>> = {
	restart: RotateCcw,
	start: Play,
	stop: Square,
};
const viewportPadding = 8;

const actionIcon = (action: QuickActionDefinition) => {
	const actionName = action.actionId.split(".")[1] || "";
	return actionIcons[actionName] || Terminal;
};

export function QuickActionMenu({
	actions,
	onRun,
}: {
	actions: QuickActionDefinition[];
	onRun: (action: QuickActionDefinition) => void;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [position, setPosition] = useState({ left: 0, top: 0 });
	const buttonRef = useRef<HTMLButtonElement | null>(null);
	const menuRef = useRef<HTMLDivElement | null>(null);

	const updatePosition = () => {
		const rect = buttonRef.current?.getBoundingClientRect();
		if (!rect) return;
		const menuWidth = menuRef.current?.offsetWidth || 184;
		const menuHeight =
			menuRef.current?.offsetHeight || actions.length * 36 + 8;
		const belowTop = rect.bottom + 6;
		const aboveTop = rect.top - menuHeight - 6;
		const hasRoomBelow =
			belowTop + menuHeight <= window.innerHeight - viewportPadding;
		const preferredTop = hasRoomBelow ? belowTop : aboveTop;
		const maxTop = Math.max(
			viewportPadding,
			window.innerHeight - menuHeight - viewportPadding,
		);
		const preferredLeft = rect.right - menuWidth;
		const maxLeft = Math.max(
			viewportPadding,
			window.innerWidth - menuWidth - viewportPadding,
		);

		setPosition({
			left: Math.min(Math.max(viewportPadding, preferredLeft), maxLeft),
			top: Math.min(Math.max(viewportPadding, preferredTop), maxTop),
		});
	};

	useLayoutEffect(() => {
		if (!isOpen) return;

		updatePosition();
	}, [actions.length, isOpen]);

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

			setIsOpen(false);
		};
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setIsOpen(false);
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

	if (actions.length === 0) return null;

	return (
		<>
			<IconButton
				ref={buttonRef}
				onClick={() => setIsOpen((current) => !current)}
				aria-haspopup="menu"
				aria-expanded={isOpen}
				aria-label="Open quick actions"
				icon={MoreHorizontal}
				size="sm"
			/>

			{isOpen &&
				createPortal(
					<div
						ref={menuRef}
						className="fixed z-60 w-46 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl shadow-slate-950/15"
						style={{
							left: position.left,
							top: position.top,
						}}
						role="menu"
					>
						{actions.map((action) => {
							const Icon = actionIcon(action);
							const toneClass =
								action.tone === "danger"
									? "text-rose-700 hover:bg-rose-50"
									: "text-slate-700 hover:bg-blue-50 hover:text-blue-700";

							return (
								<button
									key={action.actionId}
									type="button"
									className={`flex min-h-9 w-full cursor-pointer items-center gap-2 px-3 text-left text-sm font-bold ${toneClass}`}
									onClick={() => {
										setIsOpen(false);
										onRun(action);
									}}
									role="menuitem"
								>
									<Icon size={15} />
									<span>{action.label}</span>
								</button>
							);
						})}
					</div>,
					document.body,
				)}
		</>
	);
}
