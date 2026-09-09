import { Code2, PenTool } from "lucide-react";
import type { PropsWithChildren, ReactNode } from "react";

import { PORTFOLIO_FRAME_CLASS } from "@/features/portfolio/portfolio-layout";
import {
	PortfolioPrimaryNavigation,
	type PortfolioPrimaryRoute,
} from "@/features/portfolio/portfolio-primary-navigation";

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
			<header className="portfolio-glass-bar portfolio-index-header" id="top">
				<div
					className={`${PORTFOLIO_FRAME_CLASS} portfolio-index-header-inner`}
				>
					<a className="portfolio-index-brand" href="/dashboard">
						<span aria-label="徐天成印" className="portfolio-seal" role="img">
							<i>徐</i>
							<i>天</i>
							<i>成</i>
							<i>印</i>
						</span>
						<span>
							<strong>TIANCHENG XU · PORTFOLIO</strong>
							<small>徐天成 · 工程作品集</small>
						</span>
					</a>
					<PortfolioPrimaryNavigation current={current} />
					<a
						aria-label="Tiancheng Xu GitHub"
						className="portfolio-index-github"
						href="https://github.com/Tiancheng-Xu"
						rel="noreferrer"
						target="_blank"
					>
						<Code2 aria-hidden="true" size={18} />
						<span>GitHub</span>
					</a>
				</div>
			</header>

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
