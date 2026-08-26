import {
	Activity,
	Archive,
	Cloud,
	Database,
	GitBranch,
	LockKeyhole,
	RefreshCw,
	ShieldCheck,
	Square,
	Workflow,
} from "lucide-react";

type ProofState = "本地已实现" | "设计已确认" | "共享已核实" | "云端未部署" | "云端已验证";

type FlowStep = {
	detail: string;
	label: string;
	state: ProofState;
};

const RUNTIME_LANES: Array<{
	description: string;
	name: string;
	steps: FlowStep[];
}> = [
	{
		name: "公开读取链路",
		description: "Dashboard 与 Evidence 读取同一份公开状态投影；停止服务后仍展示最后一次校验通过的快照。",
		steps: [
			{ label: "用户浏览器", detail: "查看状态与历史指标", state: "本地已实现" },
			{ label: "Cloudflare Pages", detail: "Dashboard / Evidence", state: "本地已实现" },
			{ label: "D1 公开投影", detail: "状态、摘要、ETag", state: "本地已实现" },
			{ label: "R2 不可变快照", detail: "校验后更新 latest 指针", state: "本地已实现" },
		],
	},
	{
		name: "受保护控制链路",
		description: "控制入口不提供任意 AWS 命令，只允许启动观测和安全停止两种固定动作。",
		steps: [
			{ label: "Cloudflare Access", detail: "JWT 与操作者白名单", state: "云端未部署" },
			{ label: "成本控制页", detail: "固定动作 + 风险提示", state: "本地已实现" },
			{ label: "GitHub App", detail: "仅触发允许的工作流", state: "云端未部署" },
			{ label: "GitHub Actions", detail: "项目 OIDC Role", state: "云端已验证" },
		],
	},
	{
		name: "性能数据与失败链路",
		description: "浏览器 SDK 只上报允许字段；异步队列隔离业务，DLQ、日志和最终快照保留可审计结果。",
		steps: [
			{ label: "性能 SDK", detail: "Web Vitals / 路由 / 错误", state: "设计已确认" },
			{ label: "HTTP API + Lambda", detail: "校验、接收、查询", state: "云端已验证" },
			{ label: "SQS / DLQ", detail: "缓冲与失败边界", state: "云端已验证" },
			{ label: "一次性 ECS Cleaner", detail: "按需聚合，不常驻", state: "云端已验证" },
			{ label: "历史快照", detail: "Artifact 校验后公开", state: "云端已验证" },
		],
	},
	{
		name: "共享基础设施边界",
		description: "项目只创建精确命名的临时观测资源，网络、数据库和身份底座复用且受删除保护。",
		steps: [
			{ label: "共享 VPC / 私网", detail: "应用子网与安全组", state: "共享已核实" },
			{ label: "共享 NAT Gateway", detail: "私网统一出网", state: "共享已核实" },
			{ label: "共享 RDS PostgreSQL", detail: "项目 Schema 隔离", state: "共享已核实" },
			{ label: "共享 OIDC", detail: "项目 Role 最小权限", state: "共享已核实" },
		],
	},
];

const DELIVERY_STEPS: FlowStep[] = [
	{ label: "Pull Request", detail: "变更进入独立预览", state: "设计已确认" },
	{ label: "GitHub Actions", detail: "测试、类型、构建、预算门禁", state: "云端已验证" },
	{ label: "Cloudflare Preview", detail: "预览 Dashboard / Evidence", state: "云端未部署" },
	{ label: "合成闭环", detail: "受控流量，不冒充生产趋势", state: "云端已验证" },
	{ label: "快照验收", detail: "Schema、样本、SHA、摘要", state: "云端已验证" },
	{ label: "清理验证", detail: "Schema、Stack、Cluster 归零", state: "云端已验证" },
];

const LIFECYCLE_PHASES = [
	{
		icon: ShieldCheck,
		name: "安全启动",
		state: "云端已验证" as const,
		steps: [
			"先验证上次清理完成，共享资源健康且未发生漂移。",
			"通过 Access 与固定 GitHub Actions 工作流创建项目临时资源。",
			"健康检查通过后才把 controlState 切换为 running。",
		],
	},
	{
		icon: Activity,
		name: "采集与聚合",
		state: "云端已验证" as const,
		steps: [
			"SDK 批量上报允许字段，Lambda 校验后写入 SQS。",
			"一次性 Cleaner 聚合 p50 / p75 / p95 与错误数。",
			"快照经结构、敏感信息与摘要校验后写入 R2，并更新 D1 投影。",
		],
	},
	{
		icon: Square,
		name: "安全停止",
		state: "云端已验证" as const,
		steps: [
			"先停止接收新事件，再记录主队列与 DLQ 深度。",
			"生成最终不可覆盖快照，Dashboard / Evidence 切到 historical。",
			"删除项目临时 Stack、Schema 与 Role，清理验证通过后标记 stopped。",
		],
	},
];

export function PerformanceEvidenceDiagrams() {
	return (
		<div className="space-y-6" aria-label="性能观测完整架构与流程">
			<section className="space-y-4" aria-labelledby="runtime-architecture-heading">
				<DiagramHeader
					description="从公开读取、受保护控制、性能数据到共享底座，展示真实职责、信任边界和失败路径。"
					icon={<Cloud aria-hidden="true" size={20} />}
					id="runtime-architecture-heading"
					title="运行架构图"
				/>
				<div className="space-y-4">
					{RUNTIME_LANES.map((lane) => (
						<article className="border border-[#c7ced8] bg-[#f7f8fa] p-4" key={lane.name}>
							<div className="mb-4">
								<h3 className="font-bold text-sm">{lane.name}</h3>
								<p className="mt-1 text-[#52606d] text-xs leading-relaxed">{lane.description}</p>
							</div>
							<FlowSteps steps={lane.steps} />
						</article>
					))}
				</div>
				<ProofCaption
					look="看公开状态与控制链路是否分离，以及临时资源与共享 VPC、NAT、RDS、OIDC 的边界。"
					proof="证明设计能在观测服务停止时继续展示可信快照，同时避免控制页获得通用 AWS 权限。"
				/>
			</section>

			<section className="space-y-4" aria-labelledby="delivery-heading">
				<DiagramHeader
					description="同一条交付链同时约束代码质量、费用、预览、合成验证、晋级与精确清理。"
					icon={<GitBranch aria-hidden="true" size={20} />}
					id="delivery-heading"
					title="GitHub Actions、预览与灰度"
				/>
				<div className="border border-[#c7ced8] bg-[#f7f8fa] p-4">
					<FlowSteps steps={DELIVERY_STEPS} />
				</div>
				<ProofCaption
					look="看 PR 是否先经过测试和预算 Gate，再进入 Cloudflare Preview、合成闭环与清理验证。"
					proof="证明灰度不是直接替换生产，而是基于真实预览结果决定晋级或回滚。"
				/>
			</section>

			<section className="space-y-4" aria-labelledby="lifecycle-heading">
				<DiagramHeader
					description="controlState 与 dataMode 分开：资源可停止，但最近一次可信数据仍可处于 historical 模式。"
					icon={<RefreshCw aria-hidden="true" size={20} />}
					id="lifecycle-heading"
					title="启动、采集与停止时序"
				/>
				<div className="grid gap-4 lg:grid-cols-3">
					{LIFECYCLE_PHASES.map((phase, index) => {
						const Icon = phase.icon;
						return (
							<article className="border border-[#c7ced8] bg-white p-4" key={phase.name}>
								<div className="flex items-start justify-between gap-3">
									<div className="flex items-center gap-2">
										<span className="grid size-9 place-items-center bg-[#0f2d4d] text-white">
											<Icon aria-hidden="true" size={17} />
										</span>
										<h3 className="font-bold">{index + 1}. {phase.name}</h3>
									</div>
									<StateBadge state={phase.state} />
								</div>
								<ol className="mt-4 space-y-3 text-[#52606d] text-xs leading-relaxed">
									{phase.steps.map((step) => <li className="list-inside list-decimal" key={step}>{step}</li>)}
								</ol>
							</article>
						);
					})}
				</div>
				<ProofCaption
					look="看停止顺序是否先封存最终快照，再停止任务和删除临时资源，最后执行清理验证。"
					proof="证明省成本不会牺牲 Evidence：服务停机后保留上一次真实结果，且不触碰共享基础设施。"
				/>
			</section>
		</div>
	);
}

function DiagramHeader({
	description,
	icon,
	id,
	title,
}: {
	description: string;
	icon: React.ReactNode;
	id: string;
	title: string;
}) {
	return (
		<header>
			<div className="flex items-center gap-2">
				{icon}
				<h2 className="font-semibold text-lg" id={id}>{title}</h2>
			</div>
			<p className="mt-1 text-muted-foreground text-sm leading-relaxed">{description}</p>
		</header>
	);
}

function FlowSteps({ steps }: { steps: FlowStep[] }) {
	return (
		<div className="grid gap-3 md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
			{steps.map((step, index) => (
				<div className="flex min-w-0 items-stretch gap-3" key={`${step.label}-${step.detail}`}>
					<div className="min-w-0 flex-1 border border-[#d8cfbd] bg-white p-3">
						<div className="flex items-start justify-between gap-2">
							<p className="font-bold text-sm">{step.label}</p>
							{step.label.includes("D1") || step.label.includes("RDS") ? <Database aria-hidden="true" className="shrink-0 text-[#0f2d4d]" size={15} /> : null}
							{step.label.includes("R2") ? <Archive aria-hidden="true" className="shrink-0 text-[#0f2d4d]" size={15} /> : null}
							{step.label.includes("Access") || step.label.includes("OIDC") ? <LockKeyhole aria-hidden="true" className="shrink-0 text-[#0f2d4d]" size={15} /> : null}
							{step.label.includes("Actions") || step.label.includes("App") ? <Workflow aria-hidden="true" className="shrink-0 text-[#0f2d4d]" size={15} /> : null}
						</div>
						<p className="mt-2 text-[#52606d] text-xs leading-relaxed">{step.detail}</p>
						<div className="mt-3"><StateBadge state={step.state} /></div>
					</div>
					{index < steps.length - 1 ? <span aria-hidden="true" className="hidden self-center font-bold text-[#0f2d4d] md:block">→</span> : null}
				</div>
			))}
		</div>
	);
}

function StateBadge({ state }: { state: ProofState }) {
	const tone = state === "本地已实现"
		? "border-emerald-300 bg-emerald-50 text-emerald-950"
		: state === "云端已验证"
			? "border-teal-400 bg-teal-50 text-teal-950"
		: state === "共享已核实"
			? "border-blue-300 bg-blue-50 text-blue-950"
			: state === "云端未部署"
				? "border-amber-300 bg-amber-50 text-amber-950"
				: "border-[#d8cfbd] bg-[#f8f3e8] text-[#4d5863]";
	return <span className={`inline-flex border px-2 py-1 font-bold text-[10px] ${tone}`}>{state}</span>;
}

function ProofCaption({ look, proof }: { look: string; proof: string }) {
	return (
		<div className="grid gap-2 border border-dashed border-[#c7ced8] bg-white/80 p-4 text-xs leading-relaxed sm:grid-cols-2">
			<p><strong>看哪里：</strong>{look}</p>
			<p><strong>证明什么：</strong>{proof}</p>
		</div>
	);
}
