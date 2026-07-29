import { X } from "lucide-react";
import { type PropsWithChildren, useEffect, useId } from "react";

type ModalProps = PropsWithChildren<{
	open: boolean;
	title: string;
	onClose: () => void;
}>;

export function Modal({ children, onClose, open, title }: ModalProps) {
	const titleId = useId();

	useEffect(() => {
		if (!open) {
			return;
		}

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [onClose, open]);

	if (!open) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-[70] grid items-end p-3 sm:place-items-center">
			<button
				aria-label="关闭弹窗背景"
				className="absolute inset-0 size-full bg-foreground/25 backdrop-blur-sm"
				onClick={onClose}
				type="button"
			/>
			<section
				aria-labelledby={titleId}
				aria-modal="true"
				className="relative z-10 w-full max-w-md rounded-[2rem] bg-card p-6 shadow-floating"
				role="dialog"
			>
				<header className="mb-5 flex items-center justify-between gap-4">
					<h2 className="font-semibold text-xl" id={titleId}>
						{title}
					</h2>
					<button
						aria-label="关闭"
						className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground"
						onClick={onClose}
						type="button"
					>
						<X aria-hidden="true" size={20} />
					</button>
				</header>
				{children}
			</section>
		</div>
	);
}
