import {
	CircleDollarSign,
	CloudCog,
	LockKeyhole,
	Play,
	ShieldCheck,
	Square,
} from "lucide-react";

import { PROJECTS_INDEX } from "@/data/portfolio-projects";
import { resolvePerformanceView } from "@/features/performance/performance-state";
import { PerformanceStatusCard } from "@/features/performance/performance-status-card";
import { PortfolioPageShell } from "@/features/portfolio/portfolio-page-shell";
import { Button } from "@web/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from "@web/ui/components/card";

const START_STEPS = [
	"确认上一次临时 Stack、项目 Schema、项目角色和临时队列已经清理干净。",
	"由 Cloudflare Access 校验操作者，再由 GitHub App 触发唯一允许的启动工作流。",
	"GitHub Actions 使用项目级 OIDC Role 部署临时资源，并运行合成流量与一次性 Cleaner。",
	"校验快照结构、样本量、提交 SHA 与摘要后，才更新公开状态指针。",
];

const STOP_STEPS = [
	"先停止接收新事件，再读取主队列和 DLQ 深度，按策略排空或明确丢弃。",
	"生成最后一份不可覆盖快照，写入摘要并切换 Dashboard / Evidence 为历史数据模式。",
	"停止一次性 ECS 任务，删除项目 Schema、项目角色和精确命名的临时 Stack。",
	"确认 AWS 项目资源为空、数据库清理完成且共享 VPC、NAT、RDS 未发生变化。",
];

export function PerformanceControlContent({ projectId }: { projectId: string }) {
	const project = PROJECTS_INDEX[projectId];

	if (!project?.performance) {
		return (
			<PortfolioPageShell
				current="project"
				description="只有已登记性能观测契约的项目才能进入固定动作控制面。"
				evidenceUrl="/dashboard"
				eyebrow="Project Control"
				projectHomeUrl="/dashboard"
				title="项目不可控制"
			>
				<div className="mx-auto max-w-3xl">
				<Card>
					<CardHeader>
						<h2 className="font-serif font-bold text-2xl">访问范围</h2>
						<CardDescription>
							只有已登记性能观测契约的项目才能进入固定动作控制面。
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
			</PortfolioPageShell>
		);
	}
	const performanceView = resolvePerformanceView(project.performance);
	const latestSource = performanceView.snapshot?.source;

	return (
		<PortfolioPageShell
			current="project"
			description="AWS 临时观测链已完成真实闭环并精确清理；固定启停控制尚未部署，所有写入口继续失败关闭。"
			evidenceUrl={`/evidence/${project.id}`}
			eyebrow={`Project Control · ${project.title}`}
			projectHomeUrl={`/performance-control?project=${project.id}`}
			title="性能观测成本控制"
		>
		<div className="mx-auto max-w-5xl space-y-6">
			<PerformanceStatusCard
				projectId={project.id}
				projectName={project.title}
				status={performanceView}
			/>
			{latestSource ? (
				<section className="border border-emerald-300 bg-emerald-50 p-5 text-emerald-950">
					<h2 className="font-serif font-bold text-xl">最近一次云端验收已完成并清理</h2>
					<p className="mt-2 text-sm leading-relaxed">
						BabySteps 通过 GitHub OIDC 在 AWS us-east-1 创建临时观测链，完成受控事件、ECS Cleaner 与聚合查询后删除项目 Schema 和 Stack；剩余项目 ECS Cluster 为 0。
					</p>
					<a
						className="mt-4 inline-flex min-h-11 items-center gap-2 border border-emerald-800 px-4 py-3 font-bold text-sm"
						href={`https://github.com/${latestSource.repository}/actions/runs/${latestSource.workflowRunId}`}
						rel="noreferrer"
						target="_blank"
					>
						查看 GitHub Run #{latestSource.workflowRunId}
					</a>
				</section>
			) : null}
			<header className="border border-[#c7ced8] bg-[#f8f3e8] p-6 sm:p-8">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<p className="font-bold text-xs uppercase tracking-[0.16em] text-[#5a6470]">
							固定动作控制面 · {project.title}
						</p>
						<h2 className="mt-2 font-serif font-bold text-2xl">固定动作与安全边界</h2>
						<p className="mt-3 max-w-3xl text-[#344252] text-sm leading-relaxed">
							这里不是通用 AWS 管理控制台，只允许启动观测与安全停止两条经过审计的固定工作流。
							入口必须受 Cloudflare Access 保护，实际资源变更由项目级 OIDC Role 执行。
						</p>
					</div>
					<span className="inline-flex min-h-11 items-center gap-2 border border-amber-300 bg-amber-50 px-3 py-2 font-bold text-amber-950 text-xs">
						<LockKeyhole aria-hidden="true" size={16} />
						临时云端已验证 · 固定控制待部署
					</span>
				</div>
			</header>

			<section className="grid gap-5 lg:grid-cols-2">
				<LifecycleCard
					buttonLabel="启动性能观测"
					description="只在清理门禁通过后创建项目临时资源，并产出一轮可验证快照。"
					icon={<Play aria-hidden="true" size={18} />}
					steps={START_STEPS}
					title="安全启动"
				/>
				<LifecycleCard
					buttonLabel="安全停止性能观测"
					description="先保留最后一次可信结果，再精确清理项目资源，持续展示历史快照。"
					icon={<Square aria-hidden="true" size={17} />}
					steps={STOP_STEPS}
					title="安全停止"
				/>
			</section>

			<section className="grid gap-4 md:grid-cols-3">
				<BoundaryCard
					body="Cloudflare Access 校验身份；GitHub App 只能触发固定 GitHub Actions 工作流，不能执行任意 AWS 命令。"
					icon={<ShieldCheck aria-hidden="true" size={19} />}
					title="权限边界"
				/>
				<BoundaryCard
					body="复用共享 VPC、NAT、RDS、OIDC 与日志底座；临时 API、队列和一次性任务按项目命名并可精确删除。"
					icon={<CloudCog aria-hidden="true" size={19} />}
					title="资源边界"
				/>
				<BoundaryCard
					body="默认停止。避免常驻 ECS、Athena、Glue 和 Firehose 的持续开销；每次启动前展示预计增量资源。"
					icon={<CircleDollarSign aria-hidden="true" size={19} />}
					title="费用边界"
				/>
			</section>

			<p className="border border-dashed border-[#c7ced8] bg-white/80 p-4 text-[#4d5863] text-sm leading-relaxed">
				最近一次临时云端闭环已经验证并清理；下方按钮仍在 Access、D1 审计和 GitHub App 固定派发全部上线前保持禁用，避免把一次性验收误写成常驻控制服务。
			</p>
		</div>
		</PortfolioPageShell>
	);
}

function LifecycleCard({
	buttonLabel,
	description,
	icon,
	steps,
	title,
}: {
	buttonLabel: string;
	description: string;
	icon: React.ReactNode;
	steps: string[];
	title: string;
}) {
	return (
		<Card>
			<CardHeader>
				<h2 className="font-medium text-sm">{title}</h2>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<ol className="space-y-3 text-sm text-muted-foreground">
					{steps.map((step, index) => (
						<li className="flex items-start gap-3" key={step}>
							<span className="grid size-6 shrink-0 place-items-center bg-[#0f2d4d] font-bold text-white text-xs">
								{index + 1}
							</span>
							<span className="pt-0.5 leading-relaxed">{step}</span>
						</li>
					))}
				</ol>
				<Button className="min-h-11 w-full" disabled type="button">
					{icon}
					{buttonLabel}
				</Button>
				<p className="text-center text-muted-foreground text-xs">固定启停控制尚未部署</p>
			</CardContent>
		</Card>
	);
}

function BoundaryCard({
	body,
	icon,
	title,
}: {
	body: string;
	icon: React.ReactNode;
	title: string;
}) {
	return (
		<article className="border border-[#d8cfbd] bg-white/85 p-5">
			<div className="flex items-center gap-2 font-bold">
				{icon}
				<h2>{title}</h2>
			</div>
			<p className="mt-3 text-[#4d5863] text-sm leading-relaxed">{body}</p>
		</article>
	);
}
