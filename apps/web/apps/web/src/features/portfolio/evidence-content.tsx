import { Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	CheckCircle2,
	CircleCheckBig,
	Clock3,
	ExternalLink,
} from "lucide-react";

import { PROJECTS_INDEX } from "@/data/portfolio-projects";
import { PortfolioPageShell } from "@/features/portfolio/portfolio-page-shell";
import { PerformanceEvidenceDiagrams } from "@/features/performance/performance-evidence-diagrams";
import { resolvePerformanceView } from "@/features/performance/performance-state";
import { PerformanceStatusCard } from "@/features/performance/performance-status-card";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@web/ui/components/card";

export function EvidenceContent({ projectId }: { projectId: string }) {
	const project = PROJECTS_INDEX[projectId];

	if (!project) {
		return (
			<div className="space-y-4">
				<header>
					<h1 className="font-bold text-2xl">项目不存在</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						该卡片已失效或未在看板中配置，建议返回看板后重试。
					</p>
				</header>
				<Link
					className="inline-flex min-h-11 items-center gap-2 text-primary text-sm"
					to="/dashboard"
				>
					<ArrowLeft aria-hidden="true" size={16} />
					返回看板
				</Link>
			</div>
		);
	}

	return (
		<PortfolioPageShell
			current="evidence"
			description={project.desc}
			evidenceUrl={project.evidenceUrl ?? `/evidence/${project.id}`}
			eyebrow="Project Evidence"
			projectHomeUrl={project.ownerPage ?? (project.performance ? `/performance-control?project=${project.id}` : "/dashboard")}
			title={project.title}
		>
			<Card className="rounded-none border-[#c7ced8] bg-white/90 shadow-sm">
				<CardHeader>
					<CardTitle className="text-xl">{project.title}</CardTitle>
					<CardDescription>{project.desc}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-5">
					{project.performance ? (
						<PerformanceStatusCard
							projectId={project.id}
							projectName={project.title}
							status={resolvePerformanceView(project.performance)}
						/>
					) : null}
					{project.caseStudy ? (
						<div className="border border-amber-300 bg-amber-50 p-4 text-amber-950 text-sm leading-relaxed">
							<strong>当前证据状态：</strong> {project.caseStudy.stateNotice}
						</div>
					) : null}
					<p className="text-sm leading-relaxed text-muted-foreground">
						以下为该项目完整工作证明内容，支持回跳看板并访问对应 evidence 页面。
					</p>
					<div className="flex flex-wrap gap-2 text-xs">
						<span className="inline-flex items-center gap-1 rounded-full border border-border/50 px-2.5 py-1">
							{project.status === "已完成" ? (
								<CheckCircle2 aria-hidden="true" size={14} />
							) : (
								<Clock3 aria-hidden="true" size={14} />
							)}
							{project.status}
						</span>
						<span className="inline-flex items-center gap-1 rounded-full border border-border/50 px-2.5 py-1">
							进度 {project.progress}%
						</span>
					</div>
					<div className="space-y-1">
						<h2 className="font-medium text-foreground">项目架构</h2>
						<p className="leading-relaxed text-muted-foreground text-sm">
							{project.architecture}
						</p>
					</div>
					<div className="space-y-2">
						<h2 className="font-medium text-foreground">Evidence 结构</h2>
						<ul className="space-y-2 text-sm text-muted-foreground">
							{project.evidence.map((item) => (
								<li className="flex items-start gap-2" key={item}>
									<CircleCheckBig
										aria-hidden="true"
										className="mt-0.5 flex-none text-primary"
										size={16}
									/>
									<span>{item}</span>
								</li>
							))}
						</ul>
					</div>
					{project.caseStudy ? (
						<>
							{project.id === "performance-observability-control" ? (
								<PerformanceEvidenceDiagrams />
							) : null}
							<section className="space-y-3">
								<h2 className="font-semibold text-lg">作业要求到证据映射</h2>
								<div className="overflow-x-auto">
									<table className="w-full min-w-[760px] border-collapse text-left text-sm">
										<thead>
											<tr className="bg-muted/60">
												{["作业要求", "实现功能", "代码位置", "验证证据", "状态"].map((heading) => (
													<th className="border border-border p-3" key={heading}>{heading}</th>
												))}
											</tr>
										</thead>
										<tbody>
											{project.caseStudy.requirements.map((item) => (
												<tr key={item.requirement}>
													<td className="border border-border p-3 align-top">{item.requirement}</td>
													<td className="border border-border p-3 align-top">{item.implementation}</td>
													<td className="border border-border p-3 align-top font-mono text-xs">{item.code}</td>
													<td className="border border-border p-3 align-top">{item.proof}</td>
													<td className="border border-border p-3 align-top font-medium">{item.state}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</section>

							{project.caseStudy.sections.map((section) => (
								<section className="space-y-3 border border-border/70 bg-muted/20 p-4" key={section.title}>
									<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
										<h2 className="font-semibold text-lg">{section.title}</h2>
										<span className="w-fit rounded-full border border-border bg-background px-2.5 py-1 font-medium text-xs">{section.state}</span>
									</div>
									<p className="text-muted-foreground text-sm leading-relaxed">{section.summary}</p>
									<ol className="space-y-2 text-sm text-muted-foreground">
										{section.steps.map((step, index) => (
											<li className="flex items-start gap-3" key={step}>
												<span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary font-bold text-primary-foreground text-xs">{index + 1}</span>
												<span className="pt-0.5 leading-relaxed">{step}</span>
											</li>
										))}
									</ol>
								</section>
							))}
						</>
					) : null}
					<div className="space-y-2">
						<h2 className="font-medium text-foreground">项目说明</h2>
						<ul className="space-y-2 text-sm text-muted-foreground">
							{project.details.map((item) => (
								<li className="list-inside list-disc" key={item}>
									{item}
								</li>
							))}
						</ul>
					</div>
					<footer className="flex flex-wrap items-center gap-3 border-border border-t pt-5">
						<Link className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-4 py-2 text-sm" to="/dashboard">
							<ArrowLeft aria-hidden="true" size={15} />
							返回项目主页
						</Link>
						<Link className="inline-flex min-h-11 items-center rounded-md border border-border px-4 py-2 text-sm" to="/dashboard">
							返回作品集
						</Link>
					{project.evidenceUrl ? (
						<a
							className="inline-flex min-h-11 items-center gap-1 rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm"
							href={project.evidenceUrl}
							rel="noreferrer"
							target="_blank"
						>
							查看完整工作证明
							<ExternalLink aria-hidden="true" size={14} />
						</a>
					) : project.caseStudy ? null : (
						<p className="text-sm text-muted-foreground">
							完整工作证明：待补充（可先返回看板后更新证据链接）
						</p>
					)}
					</footer>
				</CardContent>
			</Card>
		</PortfolioPageShell>
	);
}
