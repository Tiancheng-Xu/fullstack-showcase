import { PenTool } from "lucide-react";
import type { PropsWithChildren, ReactNode } from "react";

import { PORTFOLIO_FRAME_CLASS } from "@/features/portfolio/portfolio-layout";
import {
	PortfolioPrimaryNavigation,
	type PortfolioPrimaryRoute,
} from "@/features/portfolio/portfolio-primary-navigation";
import { PortfolioSiteHeader } from "@/features/portfolio/portfolio-site-header";

export function PortfolioIndexShell({
	children,
	current,
	description,
	kicker,
	title,
}: PropsWithChildren<{
	current: PortfolioPrimaryRoute;
	description: string;
	kicker: string;
	title: string;
}>) {
	return (
		<div className="portfolio-surface portfolio-index-surface min-h-screen overflow-x-hidden">
			<PortfolioSiteHeader current={current} />

			<main className={`${PORTFOLIO_FRAME_CLASS} portfolio-index-main`}>
				<section className="portfolio-index-hero">
					<p>{kicker}</p>
					<h1>{title}</h1>
					<span aria-hidden="true" />
					<strong>{description}</strong>
				</section>
				{children}
			</main>

			<footer className="portfolio-glass-footer portfolio-index-footer">
				<div className={PORTFOLIO_FRAME_CLASS}>
					<span>
						<PenTool aria-hidden="true" size={17} /> TIANCHENG XU · PORTFOLIO
					</span>
					<a href="/dashboard">返回作品集首页</a>
				</div>
			</footer>

			<div className="portfolio-glass-mobile-nav fixed inset-x-0 bottom-0 z-40 border-[#d8cfbd] border-t bg-[#f7f1e3]/96 px-4 py-2 backdrop-blur md:hidden">
				<PortfolioPrimaryNavigation current={current} />
			</div>
		</div>
	);
}

export function PortfolioIndexSection({
	children,
	title,
}: PropsWithChildren<{ title: ReactNode }>) {
	return (
		<section className="portfolio-index-section">
			<h2>{title}</h2>
			{children}
		</section>
	);
}
