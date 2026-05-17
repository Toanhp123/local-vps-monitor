import type { FormEventHandler, ReactNode } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { Button } from "./Button";

export function SettingsPanelFrame({
	badges,
	canSave,
	children,
	error,
	icon,
	iconClassName,
	isLoading,
	isSaving,
	loadingText,
	onSubmit,
	submitLabel = "Save settings",
	title,
}: {
	badges?: ReactNode;
	canSave: boolean;
	children: ReactNode;
	error: string;
	icon: ReactNode;
	iconClassName: string;
	isLoading: boolean;
	isSaving: boolean;
	loadingText: string;
	onSubmit: FormEventHandler<HTMLFormElement>;
	submitLabel?: string;
	title: string;
}) {
	return (
		<section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
			<div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4.5 py-3.5 max-md:flex-col max-md:items-stretch">
				<div className="flex min-w-0 items-center gap-2.5">
					<div
						className={`flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
					>
						{icon}
					</div>
					<div className="min-w-0">
						<h2 className="text-lg leading-tight font-extrabold text-slate-900">
							{title}
						</h2>
						{badges && (
							<div className="mt-1 flex flex-wrap gap-1.5">
								{badges}
							</div>
						)}
					</div>
				</div>
			</div>

			{error && (
				<div className="border-b border-slate-200 px-4.5 py-3 text-sm font-bold text-rose-700">
					{error}
				</div>
			)}

			<form className="grid gap-4 p-4.5" onSubmit={onSubmit}>
				{isLoading ? (
					<div className="flex min-h-32 items-center justify-center gap-2 text-sm font-bold text-slate-500">
						<LoaderCircle size={16} className="animate-spin" />
						{loadingText}
					</div>
				) : (
					<>
						{children}

						<div className="flex justify-end">
							<Button
								type="submit"
								disabled={!canSave}
								icon={Save}
								isLoading={isSaving}
								size="lg"
								variant="accent"
							>
								{isSaving ? "Saving" : submitLabel}
							</Button>
						</div>
					</>
				)}
			</form>
		</section>
	);
}
