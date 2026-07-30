type SectionHeaderProps = {
	title: string;
	actionLabel?: string;
	onAction?: () => void;
};

export function SectionHeader({
	title,
	actionLabel,
	onAction,
}: SectionHeaderProps) {
	return (
		<div className="flex items-center justify-between gap-4">
			<h2 className="font-semibold text-[1.25rem] text-foreground tracking-[-0.02em]">
				{title}
			</h2>
			{actionLabel && onAction ? (
				<button
					className="rounded-full px-3 py-2 font-semibold text-primary text-sm transition-colors hover:bg-primary-soft/55 disabled:cursor-not-allowed disabled:opacity-45"
					onClick={onAction}
					type="button"
				>
					{actionLabel}
				</button>
			) : null}
		</div>
	);
}
