import { ArrowUpRight, BadgeCheck, FileCheck2, Workflow } from "lucide-react";
import { COMMERCIAL_PROJECTS, commercialEvidencePath } from "@/data/commercial-exploration";

import {
	PortfolioIndexSection,
	PortfolioIndexShell,
} from "@/features/portfolio/portfolio-index-shell";
import { usePortfolioProjects } from "@/features/portfolio/use-portfolio-projects";
import {
	PROJECT_PRD_EVIDENCE,
	PRD_EVIDENCE_COVERAGE,
	projectPrdSummaryUrl,
} from "@/data/project-prd-evidence";

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
			<PortfolioIndexSection title="逐项目 PRD 摘要与版本边界">
				<p className="mb-5 text-sm leading-relaxed">
					覆盖 21 个项目与叙事单元及 2 个设计模块，共 23 项。复核日期：{PRD_EVIDENCE_COVERAGE.reviewedAt}。
					子系统与历史工作归属保持关联；摘要复核不替代产品运行和生产验收。
				</p>
				<div aria-label="逐项目 PRD 摘要索引" className="portfolio-evidence-grid">
					{PROJECT_PRD_EVIDENCE.map((entry) => (
						<article className="portfolio-evidence-card" key={entry.id}>
							<header>
								<span><FileCheck2 aria-hidden="true" size={20} /></span>
								<div><p>{entry.status}</p><h3>{entry.title}</h3></div>
							</header>
							<p>{entry.positioning}</p>
							<footer>
								<a href={projectPrdSummaryUrl(entry)}>查看 PRD 摘要 <ArrowUpRight aria-hidden="true" size={14} /></a>
								<a href={entry.evidenceUrl}>项目工作证明 <ArrowUpRight aria-hidden="true" size={14} /></a>
							</footer>
						</article>
					))}
				</div>
			</PortfolioIndexSection>
			<PortfolioIndexSection title="商业探索">
				<div className="portfolio-evidence-grid">
					{COMMERCIAL_PROJECTS.map((project) => (
						<article className="portfolio-evidence-card" key={project.id}>
							<header><span><FileCheck2 aria-hidden="true" size={20} /></span><div><h3>{project.title}</h3></div></header>
							<p>{project.stage}</p>
							<footer><a href={commercialEvidencePath(project)}>工作证明<ArrowUpRight aria-hidden="true" size={14} /></a></footer>
						</article>
					))}
				</div>
			</PortfolioIndexSection>
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
			<PortfolioIndexSection title="资料覆盖与校验说明">
				<div className="space-y-4 text-sm leading-relaxed" id="prd-coverage">
					<p>{PRD_EVIDENCE_COVERAGE.courseMaterial}</p>
					<p>{PRD_EVIDENCE_COVERAGE.reviewScope} SHA-256 对应本机保留的原件字节，公开只展示规格标签与哈希。</p>
					<div className="space-y-2 border border-border p-4">
						<p>摘要口径来源：{PRD_EVIDENCE_COVERAGE.authority.name}</p>
						<code className="block break-all font-mono text-xs">{PRD_EVIDENCE_COVERAGE.authority.sha256}</code>
					</div>
					<ul className="space-y-3">
						{PRD_EVIDENCE_COVERAGE.sources.map((source) => (
							<li className="space-y-1 border-b border-border pb-3" key={source.id}>
								<p>{source.name}{source.kind === "coverage-only" ? "（仅资料索引）" : ""}</p>
								<code className="block break-all font-mono text-xs">{source.sha256}</code>
							</li>
						))}
					</ul>
				</div>
			</PortfolioIndexSection>
			<aside className="portfolio-index-note">
				<BadgeCheck size={18} /> Archify 图来自当前审核架构字段，不替代
				Run、commit、deployment 或链上回执。
			</aside>
		</PortfolioIndexShell>
	);
}
