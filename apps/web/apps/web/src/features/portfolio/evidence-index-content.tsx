import { ArrowUpRight, BadgeCheck, FileCheck2, Workflow } from "lucide-react";

import {
	PortfolioIndexSection,
	PortfolioIndexShell,
} from "@/features/portfolio/portfolio-index-shell";
import { usePortfolioProjects } from "@/features/portfolio/use-portfolio-projects";

const SKILL_PROJECT_IDS = new Set(["tc-workflow"]);

export function EvidenceIndexContent() {
	const { projects } = usePortfolioProjects();

	return (
		<PortfolioIndexShell
			current="evidence"
			description="架构图只负责解释系统组成；完成状态仍由项目自己的可追溯 Evidence 决定。"
			kicker="Evidence Directory"
			title="工作证明索引"
		>
			<PortfolioIndexSection title="项目 Evidence 与架构">
				<div className="portfolio-evidence-grid">
					{projects.map((project) => {
						const isSkill = SKILL_PROJECT_IDS.has(project.id);
						const architectureAsset = project.architectureAsset;
						return (
							<article className="portfolio-evidence-card" key={project.id}>
								<header>
									<span>
										{isSkill ? (
											<Workflow size={20} />
										) : (
											<FileCheck2 size={20} />
										)}
									</span>
									<div>
										<p>{project.status}</p>
										<h3>{project.title}</h3>
									</div>
								</header>
								{isSkill ? (
									<div className="portfolio-skill-architecture-note">
										<strong>Skill / 工作流项目</strong>
										<p>
											不生成系统运行时架构图；以节点合同、Gate、Checkpoint 和
											RunResult 文档作为结构证明。
										</p>
									</div>
								) : architectureAsset ? (
									<>
										<section
											aria-label={`${project.title} 可横向滚动查看完整架构图`}
											className="portfolio-archify-viewport"
											// biome-ignore lint/a11y/noNoninteractiveTabindex: the horizontally scrollable architecture canvas must be keyboard-focusable
											tabIndex={0}
										>
											<img
												alt={`${project.title} Archify 架构图`}
												className="portfolio-archify-image"
												loading="lazy"
												src={`/${architectureAsset}`}
											/>
										</section>
										<a
											className="portfolio-architecture-open"
											href={`/${architectureAsset}`}
											rel="noreferrer"
											target="_blank"
										>
											打开完整架构图 <ArrowUpRight size={14} />
										</a>
									</>
								) : (
									<div className="portfolio-skill-architecture-note">
										<strong>架构图待审核</strong>
										<p>
											同步项目尚未绑定本地审核过的架构资产，因此不加载外部
											iframe。
										</p>
									</div>
								)}
								<p>{project.architecture}</p>
								<footer>
									{project.evidenceUrl ? (
										<a
											href={project.evidenceUrl}
											rel={
												project.evidenceUrl.startsWith("http")
													? "noreferrer"
													: undefined
											}
										>
											查看项目工作证明 <ArrowUpRight size={14} />
										</a>
									) : (
										<span>尚无公开工作证明</span>
									)}
									{project.ownerPage ? (
										<a
											href={project.ownerPage}
											rel={
												project.ownerPage.startsWith("http")
													? "noreferrer"
													: undefined
											}
										>
											项目入口 <ArrowUpRight size={14} />
										</a>
									) : null}
								</footer>
							</article>
						);
					})}
				</div>
			</PortfolioIndexSection>
			<aside className="portfolio-index-note">
				<BadgeCheck size={18} /> Archify 图来自当前审核架构字段，不替代
				Run、commit、deployment 或链上回执。
			</aside>
		</PortfolioIndexShell>
	);
}
