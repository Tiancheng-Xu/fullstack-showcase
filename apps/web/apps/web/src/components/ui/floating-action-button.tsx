import { Plus } from "lucide-react";
import type { ReactNode } from "react";

type FloatingActionButtonProps = {
	icon?: ReactNode;
	label: string;
	onClick: () => void;
};

export function FloatingActionButton({
	icon,
	label,
	onClick,
}: FloatingActionButtonProps) {
	return (
		<button
			aria-label={label}
			className="fixed right-5 bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] z-40 grid size-16 place-items-center rounded-full bg-primary-container text-primary shadow-floating transition-transform hover:scale-105 active:scale-95 sm:right-[max(1.25rem,calc((100vw-48rem)/2+1.25rem))]"
			onClick={onClick}
			type="button"
		>
			{icon ?? <Plus aria-hidden="true" strokeWidth={2.5} />}
		</button>
	);
}
