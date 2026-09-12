import { ArrowUpRight, Maximize2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { PortfolioProject } from "@/data/portfolio-projects";

const toPublicUrl = (asset: string) =>
	asset.startsWith("/") ? asset : `/${asset}`;

export function getProjectArchitectureInteractiveUrl(project: PortfolioProject) {
	if (!project.architectureAsset) return undefined;
	return `/architecture/${project.id}.interactive.html`;
}

export function ProjectArchitecturePreview({
	project,
}: {
	project: PortfolioProject;
}) {
	const [open, setOpen] = useState(false);
	const titleId = useId();
	const triggerRef = useRef<HTMLButtonElement | null>(null);
	const dialogRef = useRef<HTMLDialogElement | null>(null);
	const closeButtonRef = useRef<HTMLButtonElement | null>(null);
	const screenshotUrl = project.architectureAsset
		? toPublicUrl(project.architectureAsset)
		: undefined;
	const interactiveUrl = getProjectArchitectureInteractiveUrl(project);

	useEffect(() => {
		if (!open) return undefined;
		const previousOverflow = document.body.style.overflow;
		const trigger = triggerRef.current;
		const dialog = dialogRef.current;
		if (!dialog) return undefined;
		const backgroundElements = Array.from(document.body.children).filter(
			(element): element is HTMLElement =>
				element instanceof HTMLElement && element !== dialog,
		);
		const previousInertState = backgroundElements.map((element) => ({
			element,
			inert: element.hasAttribute("inert"),
		}));
		for (const element of backgroundElements) element.setAttribute("inert", "");
		if (typeof dialog.showModal === "function") dialog.showModal();
		else dialog.setAttribute("open", "");
		document.body.style.overflow = "hidden";
		closeButtonRef.current?.focus();
		return () => {
			document.body.style.overflow = previousOverflow;
			for (const entry of previousInertState) {
				if (!entry.inert) entry.element.removeAttribute("inert");
			}
			if (dialog.open && typeof dialog.close === "function") dialog.close();
			trigger?.focus();
		};
	}, [open]);

	if (!screenshotUrl || !interactiveUrl) return null;

	return (
		<>
			<figure className="portfolio-architecture-preview">
				<button
					aria-label={`查看 ${project.title} 动态架构图`}
					className="portfolio-architecture-preview__trigger"
					onClick={() => setOpen(true)}
					ref={triggerRef}
					type="button"
				>
					<img
						alt={`${project.title} 架构图静态预览`}
						decoding="async"
						loading="lazy"
						src={screenshotUrl}
					/>
					<span className="portfolio-architecture-preview__shade" />
					<span className="portfolio-architecture-preview__label">
						<Maximize2 aria-hidden="true" size={15} />
						查看动态架构图
					</span>
				</button>
				<figcaption>ARCHIFY · STATIC PREVIEW</figcaption>
			</figure>

			{open && typeof document !== "undefined"
				? createPortal(
						<dialog
							aria-labelledby={titleId}
							aria-modal="true"
							className="portfolio-architecture-dialog"
							data-testid="architecture-dialog-backdrop"
							onCancel={(event) => {
								event.preventDefault();
								setOpen(false);
							}}
							onMouseDown={(event) => {
								if (event.currentTarget === event.target) setOpen(false);
							}}
							ref={dialogRef}
						>
							<section
								className="portfolio-architecture-dialog__panel"
							>
								<header>
									<div>
										<span>INTERACTIVE ARCHITECTURE</span>
										<h2 id={titleId}>{project.title}</h2>
									</div>
									<nav aria-label={`${project.title} 架构图操作`}>
										<a href={interactiveUrl} rel="noreferrer" target="_blank">
											全屏打开 <ArrowUpRight aria-hidden="true" size={15} />
										</a>
										<button
											aria-label="关闭动态架构图"
											onClick={() => setOpen(false)}
											ref={closeButtonRef}
											type="button"
										>
											<X aria-hidden="true" size={19} />
										</button>
									</nav>
								</header>
								<iframe
									allowFullScreen
									loading="lazy"
									sandbox="allow-downloads allow-scripts"
									src={interactiveUrl}
									title={`${project.title} Archify 动态架构图`}
								/>
							</section>
						</dialog>,
						document.body,
					)
				: null}
		</>
	);
}
