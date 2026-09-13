import { PenTool } from "lucide-react";
import type { ReactNode } from "react";

import { PORTFOLIO_FRAME_CLASS } from "@/features/portfolio/portfolio-layout";
import { PortfolioSiteHeader } from "@/features/portfolio/portfolio-site-header";

type PortfolioPage = "portfolio" | "project" | "evidence";

export function PortfolioPageShell({
	children,
	current,
	description,
	evidenceUrl,
	eyebrow,
	projectHomeUrl,
	title,
}: {
	children: ReactNode;
	current: PortfolioPage;
	description: string;
	evidenceUrl: string;
	eyebrow: string;
	projectHomeUrl: string;
	title: string;
}) {
	const primaryCurrent = current === "evidence" ? "evidence" : current === "portfolio" ? "dashboard" : "projects";

	return (
		<div className="portfolio-surface relative left-1/2 min-h-screen w-screen max-w-none -translate-x-1/2 overflow-x-hidden bg-[#f7f1e3] pb-24 text-[#071d34] md:pb-0">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 opacity-40"
				style={{
					backgroundImage:
						"radial-gradient(circle at 18% 8%, rgba(184,33,57,.08), transparent 26%), radial-gradient(circle at 82% 42%, rgba(15,45,77,.08), transparent 30%), linear-gradient(90deg, rgba(7,29,52,.03) 1px, transparent 1px), linear-gradient(rgba(7,29,52,.025) 1px, transparent 1px)",
					backgroundSize: "auto, auto, 34px 34px, 34px 34px",
				}}
			/>

			<PortfolioSiteHeader current={primaryCurrent} />

			<main className={`${PORTFOLIO_FRAME_CLASS} relative py-8 md:py-12`}>
				<header className="border-[#d8cfbd] border-b pb-6">
					<p className="font-bold text-[#bf1737] text-xs uppercase tracking-[0.18em]">{eyebrow}</p>
					<h1 className="mt-3 font-serif font-bold text-3xl leading-tight md:text-5xl">{title}</h1>
					<p className="portfolio-glass-note mt-4 max-w-3xl border-l-4 border-[#bf1737] bg-[#fbf8ef]/85 px-4 py-3 text-[#344252] text-sm leading-relaxed md:text-base">
						{description}
					</p>
				</header>
				<div className="portfolio-module-stack mt-7">{children}</div>
			</main>

			<footer className="portfolio-glass-footer relative border-[#c8c0b0] border-t bg-[#ebe6da]">
				<div className={`${PORTFOLIO_FRAME_CLASS} flex min-h-24 flex-col items-center justify-between gap-4 py-7 text-center md:flex-row md:text-left`}>
					<div className="flex items-center gap-3 font-bold text-sm">
						<PenTool aria-hidden="true" className="text-[#bf1737]" size={18} />
						<span>TIANCHENG XU · PROJECT DELIVERY</span>
					</div>
					<div className="flex flex-wrap justify-center gap-2">
						<a className="inline-flex min-h-11 items-center border border-[#c8bda9] bg-[#fbf6ea] px-4 font-bold text-xs" href="/dashboard">返回作品集</a>
						<a className="inline-flex min-h-11 items-center bg-[#bf1737] px-4 font-bold text-white text-xs" href={current === "evidence" ? projectHomeUrl : evidenceUrl}>
							{current === "evidence" ? "返回项目主页" : "查看完整工作证明"}
						</a>
					</div>
				</div>
			</footer>

			<div className="portfolio-glass-mobile-nav fixed inset-x-0 bottom-0 z-50 border-[#d8cfbd] border-t bg-[#f7f1e3]/96 px-4 py-2 backdrop-blur md:hidden">
				<PortfolioPrimaryNavigation current={primaryCurrent} />
			</div>
		</div>
	);
}
