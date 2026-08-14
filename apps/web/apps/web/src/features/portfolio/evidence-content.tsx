import { Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, CircleCheckBig, Clock3, CheckCircle2 } from "lucide-react";

import { PROJECTS_INDEX } from "@/data/portfolio-projects";
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
					className="inline-flex items-center gap-2 text-primary text-sm"
					to="/dashboard"
				>
					<ArrowLeft aria-hidden="true" size={16} />
					返回看板
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-5">
			<Link
				className="inline-flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground"
				to="/dashboard"
			>
				<ArrowLeft aria-hidden="true" size={16} />
				返回看板
			</Link>

			<Card>
				<CardHeader>
					<CardTitle className="text-xl">{project.title}</CardTitle>
					<CardDescription>{project.desc}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-5">
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
					{project.evidenceUrl ? (
						<a
							className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
							href={project.evidenceUrl}
							rel="noreferrer"
							target="_blank"
						>
							查看完整工作证明
							<ExternalLink aria-hidden="true" size={14} />
						</a>
					) : (
						<p className="text-sm text-muted-foreground">
							完整工作证明：待补充（可先返回看板后更新证据链接）
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
