import { ArrowUpRight, BadgeCheck, GitBranch, Layers3 } from "lucide-react";

import { getProjectPageLinks } from "@/data/portfolio-projects";
import {
	PortfolioIndexSection,
	PortfolioIndexShell,
} from "@/features/portfolio/portfolio-index-shell";
import { ProjectArchitecturePreview } from "@/features/portfolio/project-architecture-preview";
import { usePortfolioProjects } from "@/features/portfolio/use-portfolio-projects";

export function ProjectIndexContent() {
	const { projects, syncedAt } = usePortfolioProjects();

	return (
		<PortfolioIndexShell
			current="projects"
			description="查看全部项目的真实状态、架构边界、技术栈与对应交付入口。"
			kicker="Project Index"
			title="项目索引"
		>
			<PortfolioIndexSection title="全部项目">
				<p className="portfolio-index-freshness">
					{syncedAt
						? `同步索引更新于 ${new Date(syncedAt).toLocaleString("zh-CN")}`
						: "静态审核索引 · GitHub App 同步可用时自动合并"}
				</p>
				<div className="portfolio-index-grid">
					{projects.map((project, index) => {
						const links = getProjectPageLinks(project);
						return (
							<article className="portfolio-index-card" key={project.id}>
								<div className="portfolio-index-card-heading">
									<span>{String(index + 1).padStart(2, "0")}</span>
									<p
										className={
											project.status === "已完成"
												? "is-complete"
												: "is-progress"
										}
									>
										{project.status}
									</p>
								</div>
								<h3>{project.title}</h3>
								<p className="portfolio-index-description">{project.desc}</p>
								{project.summaryPoints ? (
									<ul className="portfolio-index-highlights">
										{project.summaryPoints.map((point) => (
											<li key={point}>{point}</li>
										))}
									</ul>
								) : null}
								<ProjectArchitecturePreview project={project} />
								<dl>
									<div>
										<dt>
											<Layers3 size={15} /> 架构
										</dt>
										<dd>{project.architecture}</dd>
									</div>
									<div>
										<dt>
											<GitBranch size={15} /> 技术
										</dt>
										<dd className="portfolio-index-tags">
											{project.skills.map((skill) => (
												<span key={skill}>{skill}</span>
											))}
										</dd>
									</div>
								</dl>
								<div className="portfolio-index-card-footer">
									<span>{project.progress}%</span>
									<div>
										<i
											style={{ width: `${Math.min(project.progress, 100)}%` }}
										/>
									</div>
								</div>
								<nav aria-label={`${project.title} 项目入口`}>
									{links.map((link) => (
										<a
											href={link.href}
											key={link.id}
											rel={
												link.href.startsWith("http") ? "noreferrer" : undefined
											}
										>
											{link.label}
											<ArrowUpRight size={14} />
										</a>
									))}
									{project.repo ? (
										<a
											href={`https://github.com/${project.repo}`}
											rel="noreferrer"
											target="_blank"
										>
											GitHub
											<ArrowUpRight size={14} />
										</a>
									) : null}
								</nav>
							</article>
						);
					})}
				</div>
			</PortfolioIndexSection>
			<aside className="portfolio-index-note">
				<BadgeCheck size={18} /> 状态以项目自身生产页面和 Evidence
				为准；进行中项目不会被包装成已完成。
			</aside>
		</PortfolioIndexShell>
	);
}
