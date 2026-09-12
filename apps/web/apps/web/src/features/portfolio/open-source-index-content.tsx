import { ArrowUpRight, CircleDot, GitMerge, GitPullRequest, Star } from "lucide-react";

import {
	getOpenSourceRepositoryIconSrc,
	OPEN_SOURCE_REPOSITORY_ICON_FALLBACK,
	openSourceRepositoryDetails,
} from "@/features/portfolio/open-source-data";
import {
	PortfolioIndexSection,
	PortfolioIndexShell,
} from "@/features/portfolio/portfolio-index-shell";
import { TechnologyParticleBackdrop } from "@/features/portfolio/technology-particle-backdrop";

export function OpenSourceIndexContent() {
	return (
		<PortfolioIndexShell
			current="open-source"
			description="按上游仓库聚合公开贡献，展示每项修复内容、当前状态以及可核验的 PR 与 Issue 入口。"
			kicker="Open Source Contributions"
			title="开源社区共建"
		>
			<TechnologyParticleBackdrop />
			<PortfolioIndexSection title="全部共建仓库">
				<p className="portfolio-index-freshness">
					已合并贡献优先，同组按仓库 Star 数排序；贡献状态以当前公开记录为准。
				</p>
				<div className="portfolio-index-grid portfolio-open-source-grid">
					{openSourceRepositoryDetails.map((repository) => (
						<article className="portfolio-index-card portfolio-open-source-card" key={repository.project}>
							<div className="portfolio-index-card-heading">
								<h3>
									<a className="portfolio-open-source-repository" href={repository.href} rel="noreferrer" target="_blank">
										<span aria-hidden="true" className="portfolio-open-source-repository-icon">
											<GitPullRequest size={18} />
											<img
												alt=""
												height="40"
												loading="lazy"
												onError={(event) => {
													if (
														event.currentTarget.getAttribute("src") !==
														OPEN_SOURCE_REPOSITORY_ICON_FALLBACK
													) {
														event.currentTarget.src =
															OPEN_SOURCE_REPOSITORY_ICON_FALLBACK;
													}
												}}
												src={getOpenSourceRepositoryIconSrc(repository.href)}
												width="40"
											/>
										</span>
										<span>{repository.project}</span>
									</a>
								</h3>
								<p className="inline-flex items-center gap-1 text-[#59636d]">
									<Star aria-hidden="true" size={14} />
									{repository.stars.toLocaleString("en-US")}
								</p>
							</div>
							<p className="mt-3 flex flex-wrap gap-2 text-sm">
								<span className="inline-flex items-center gap-1 text-[#187044]">
									<GitMerge aria-hidden="true" size={15} /> 已合并 {repository.merged}
								</span>
								<span className="inline-flex items-center gap-1 text-[#a85b19]">
									<CircleDot aria-hidden="true" size={15} /> Review 中 {repository.open}
								</span>
							</p>
							<div className="portfolio-open-source-pr-list">
								{repository.pullRequests.map((pullRequest) => (
									<section
										className="portfolio-glass-subpanel portfolio-open-source-pr"
										key={pullRequest.href}
									>
										<div className="portfolio-open-source-pr-heading">
											<strong>{pullRequest.label}</strong>
											<span className={pullRequest.status === "merged" ? "text-[#187044]" : "text-[#a85b19]"}>
												{pullRequest.status === "merged" ? "已合并" : "Review 中"}
											</span>
										</div>
										<p className="portfolio-open-source-pr-summary">
											{pullRequest.contribution}
										</p>
										<nav className="portfolio-open-source-pr-links" aria-label={repository.project + " " + pullRequest.label + " 相关链接"}>
											<a href={pullRequest.href} rel="noreferrer" target="_blank">
												查看 PR <ArrowUpRight aria-hidden="true" size={14} />
											</a>
											{pullRequest.issueHref ? (
												<a href={pullRequest.issueHref} rel="noreferrer" target="_blank">
													查看 Issue <ArrowUpRight aria-hidden="true" size={14} />
												</a>
											) : null}
										</nav>
									</section>
								))}
							</div>
						</article>
					))}
				</div>
			</PortfolioIndexSection>
		</PortfolioIndexShell>
	);
}
