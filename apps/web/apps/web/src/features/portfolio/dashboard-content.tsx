import {
	Activity,
	ArrowUpRight,
	Bot,
	Boxes,
	CheckCircle2,
	Clock3,
	Code2,
	Compass,
	Footprints,
	GitPullRequest,
	LayoutDashboard,
	PenTool,
	RefreshCw,
	ShieldCheck,
	Workflow,
} from "lucide-react";
import type { ReactNode } from "react";

import {
	getProjectPageLinks,
	getProjectRenderingModes,
} from "@/data/portfolio-projects";
import { DashboardScrollProgress } from "@/features/portfolio/dashboard-scroll-progress";
import { openSourceRepositories } from "@/features/portfolio/open-source-data";
import { PORTFOLIO_FRAME_CLASS } from "@/features/portfolio/portfolio-layout";
import { PortfolioSiteHeader } from "@/features/portfolio/portfolio-site-header";
import { PortfolioVoyageHero } from "@/features/portfolio/portfolio-voyage-hero";
import { TechnologyCapabilityMap } from "@/features/portfolio/technology-capability-map";
import { usePortfolioProjects } from "@/features/portfolio/use-portfolio-projects";

export function DashboardContent() {
	const { projects: visibleProjects, syncedAt } = usePortfolioProjects();

	const preferredProjectOrder = [
		"babysteps",
		"agent-market",
		"aladdin",
		"performance-observability-control",
		"shared-evidence-verifier",
		"portfolio-sync",
		"personal-ai-agent",
		"github-profile-studio",
		"fullstack-showcase",
		"tc-workflow",
	];
	const displayProjects = [...visibleProjects].sort((left, right) => {
		const leftIndex = preferredProjectOrder.indexOf(left.id);
		const rightIndex = preferredProjectOrder.indexOf(right.id);
		if (leftIndex === -1 && rightIndex === -1) return 0;
		if (leftIndex === -1) return 1;
		if (rightIndex === -1) return -1;
		return leftIndex - rightIndex;
	});
	const projectGroups = [
		{
			id: "part-time",
			title: "北京兼职项目",
			description:
				"按业务完整度、岗位覆盖面与实际参与职责整理；公开作品与非公开项目分别标注证据边界。",
			projectIds: ["babysteps", "agent-market", "aladdin"],
		},
		{
			id: "trusted-delivery",
			title: "云平台与可信交付能力",
			description:
				"展示性能观测、最小权限验证、自动同步与可追溯交付能力，不把基础设施模块包装成独立商业项目。",
			projectIds: [
				"performance-observability-control",
				"shared-evidence-verifier",
				"portfolio-sync",
			],
		},
		{
			id: "portfolio-system",
			title: "个人工程能力与作品系统",
			description:
				"用于集中证明全栈、多运行时、安全边界和作品组织能力，不计入兼职或客户项目经历。",
			projectIds: [
				"personal-ai-agent",
				"github-profile-studio",
				"fullstack-showcase",
				"tc-workflow",
			],
		},
	];
	const professionalExperience = {
		period: "2023–2026",
		title: "政企低代码 / FDE 工程师",
		location: "宁波 · 驻场交付",
		body: "驻场服务宁波市公安局科信、特警等相关业务部门，参与低代码与 FDE 项目建设，负责前台业务应用与中台能力的架构实现，以及相关模块的工程交付和持续迭代。",
	};

	const partTimeProjects = [
		{
			title: "Agent Market",
			meta: "AI Agent / 全栈工程",
			bullets: [
				"使用 LangGraph DAG 组织任务拆解、候选 Agent 过滤评分、人工或自动选定及多阶段生产分发。",
				"以 PostgreSQL Checkpoint、异步队列与 DLQ 支撑任务暂停恢复、人工介入、失败重试和复杂状态流转。",
				"结合信誉评分、LLM Evaluation 与 Web3 交付记录，形成从任务发布到结果验收的可审计闭环。",
			],
		},
		{
			title: "BabySteps",
			meta: "全栈 / Edge Web3",
			bullets: [
				"完成成长任务、家长中心、纪念馆、Provider 与链上交互等核心产品模块。",
				"建立 Edge SSR、精确水合、浏览器能力激活与一次性纯 CSR 降级链路，保证静态首屏与交互接管一致。",
				"接入真实性能观测与发布 Gate，并隔离服务端渲染、身份认证和客户端钱包的运行边界。",
			],
		},
		{
			title: "Aladdin Web3 Agent 平台",
			meta: "前端 / 全栈开发",
			bullets: [
				"参与 Agents Marketplace Web 端建设，覆盖 Job 发布、Agent 自动匹配与派单、生命周期管理及异构 Agent 调用适配。",
				"参与合约托管与结算链路联调，并通过动态工作流与 RAG 将用户创意推进为剧本、角色、场景、分镜、视频片段及最终合成。",
				"使用 Next.js / TypeScript 开发前端，协同 NestJS、Mastra、智能合约及 AWS Lambda、Aurora、SQS 处理接口、状态与异常链路。",
			],
		},
	];

	const personalEngineeringShowcases = [
		{
			title: "Personal AI Agent",
			meta: "AI 智能客服与私有化模型交付",
			body: "面向智能客服场景完成 Qwen3-8B 领域微调、量化与 Ollama 私有化交付，并以系统方案设计覆盖意图识别、知识图谱 / RAG、Tool Calling、多轮问答和低置信度转人工；技术交流可展开 QLoRA / NF4、Qwen Embedding、LlamaFactory、GGUF 与客服路由的工程取舍。",
		},
		{
			title: "GitHub Profile Studio",
			meta: "React、TanStack Router、Hono / Go、SQLite",
			body: "构建本地优先的 GitHub 公开资料工作台，以统一 API 契约验证 Hono / Node 与 Go 双后端，并通过服务端白名单和 macOS 钥匙串隔离浏览器凭据。",
		},
		{
			title: "Showcase Dashboard",
			meta: "React、TypeScript、SSG / Hydration、Cloudflare Pages",
			body: "把项目状态、Evidence、Portfolio Sync、性能观测与受保护控制入口整合为个人工程作品系统；保持静态首屏、水合后数据和项目自有链接一致，并让未知路由返回真实 404。",
		},
		{
			title: "Portfolio Sync",
			meta: "GitHub App、Cloudflare Workers、KV、HMAC",
			body: "以 GitHub App Webhook、HMAC 验签与 Cloudflare Worker/KV 汇总真实项目发布清单，并用定时任务补齐事件遗漏；难点是同步状态、静态首屏与项目自有 Evidence 的一致性。",
		},
		{
			title: "性能观测与成本控制",
			meta: "Core Web Vitals、AWS、Cloudflare、Evidence",
			body: "将浏览器真实性能样本、临时 AWS 聚合链路、成本控制与零残留清理纳入同一受保护控制面；难点是同时守住样本可信度、最小权限和预算边界。",
		},
		{
			title: "TC Flow 2.1",
			meta: "N1-N8、检查点、Review Gate、Evidence",
			body: "把需求、实现、审查、修复和发布拆成可恢复的 N1-N8 流程，沉淀本地与远端 Gate；难点是让复杂任务在失败、续跑和多人协作时仍保持可审查状态。",
		},
	];


	return (
		<div className="portfolio-surface relative left-1/2 w-screen max-w-none -translate-x-1/2 overflow-x-hidden bg-[#f7f1e3] text-[#071d34]">
			<DashboardScrollProgress />
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 opacity-[0.42]"
				style={{
					backgroundImage:
						"radial-gradient(circle at 20% 10%, rgba(184, 33, 57, 0.08), transparent 28%), radial-gradient(circle at 78% 38%, rgba(17, 58, 91, 0.07), transparent 30%), linear-gradient(90deg, rgba(7, 29, 52, 0.035) 1px, transparent 1px), linear-gradient(rgba(7, 29, 52, 0.028) 1px, transparent 1px)",
					backgroundSize: "auto, auto, 34px 34px, 34px 34px",
				}}
			/>

			<PortfolioSiteHeader current="dashboard" />

			<PortfolioVoyageHero />

			<main
				className={`${PORTFOLIO_FRAME_CLASS} portfolio-dashboard-main relative py-8 md:py-12`}
			>
				<section className="scroll-mt-24" id="skills">
					<SectionTitle
						icon={<Compass aria-hidden="true" size={18} />}
						kicker="Core Competencies"
						title="个人简历"
					/>
					<div className="portfolio-dashboard-module-card portfolio-glass-panel mt-5 border border-[#cfd5db] bg-white/84 p-5 shadow-sm md:p-8">
						<p className="max-w-4xl text-[#344252] text-sm leading-relaxed">
							全栈工程师，拥有政企低代码与 FDE
							交付经验，负责前台应用与中台能力的架构实现；当前专注 AI
							Agent、Web3、Cloud / Edge 与可验证工程交付。
						</p>
						<article className="portfolio-glass-subpanel mt-5 border border-[#d8cfbd] bg-[#f8f3e8] p-5">
							<div className="flex flex-wrap items-baseline justify-between gap-2">
								<div>
									<p className="font-bold text-[#b21f35] text-xs tracking-[0.14em]">
										{professionalExperience.period}
									</p>
									<h3 className="mt-1 font-semibold font-serif text-lg">
										{professionalExperience.title}
									</h3>
								</div>
								<p className="font-bold text-[#4d5863] text-xs">
									{professionalExperience.location}
								</p>
							</div>
							<p className="mt-3 text-[#344252] text-sm leading-relaxed">
								{professionalExperience.body}
							</p>
							<p className="mt-3 border-[#bf1737]/25 border-t pt-3 text-[#5a6470] text-xs leading-relaxed">
								政企项目仅公开职责与能力范围，不公开内部系统名称、数据、接口、部署拓扑或安全架构。
							</p>
						</article>

						<div className="mt-7">
							<h3 className="font-bold font-serif text-lg">
								项目经历
							</h3>
							<p className="mt-1 text-[#5a6470] text-xs leading-relaxed">
								按实际参与职责整理；公开作品与客户项目分别说明，不把规划或模板包装成项目经历。
							</p>
							<div className="mt-4 grid gap-4 md:grid-cols-2">
								{partTimeProjects.map((block) => (
									<ResumeProjectCard block={block} key={block.title} />
								))}
							</div>
						</div>

						<div className="mt-7">
							<h3 className="font-bold font-serif text-lg">
								个人工程能力与作品系统
							</h3>
							<p className="mt-1 text-[#5a6470] text-xs leading-relaxed">
								以下项目用于展示个人工程能力，不作为兼职或客户项目经历。
							</p>
							<div className="mt-4 grid gap-4 md:grid-cols-2">
								{personalEngineeringShowcases.map((block) => (
									<ResumeProjectCard block={block} key={block.title} />
								))}
							</div>
						</div>

					</div>
				</section>

				<TechnologyCapabilityMap />

				<section
					className="portfolio-dashboard-hero mt-10 max-w-4xl scroll-mt-24 text-left md:mt-14"
					id="about"
				>
					<h2 className="font-bold font-serif text-4xl leading-tight md:text-6xl">
						展示看板
					</h2>
					<p className="mt-2 font-serif text-[#344252] text-base tracking-[0.08em]">
						SHOWCASE DASHBOARD
					</p>
					<p className="sr-only">作者：Tiancheng Xu（Tiancheng-Xu）</p>
					<p className="mt-5 max-w-3xl border-[#bf1737] border-t pt-4 text-left text-[#344252] text-sm leading-relaxed">
						精选工程项目速览，包含架构、技术栈与进度概览。
					</p>
				</section>

				<div className="mt-10 scroll-mt-24 md:mt-14" id="projects">
					<p className="sr-only">
						{syncedAt
							? "GitHub App 自动同步 · " +
								new Date(syncedAt).toLocaleString("zh-CN")
							: "GitHub App 即时同步 · 静态项目索引兜底"}
					</p>
					<div className="mt-6 space-y-12 md:space-y-16">
						{projectGroups.map((group) => {
							const groupProjects = displayProjects.filter((project) =>
								group.projectIds.includes(project.id),
							);
							if (groupProjects.length === 0) return null;

							return (
								<section
									aria-labelledby={`project-group-${group.id}`}
									key={group.id}
								>
									<header className="portfolio-section-title border-[#d8cfbd] border-b pb-3">
										<h2
											className="font-bold font-serif text-2xl md:text-xl"
											id={`project-group-${group.id}`}
										>
											{group.title}
										</h2>
										<p className="mt-2 max-w-3xl text-[#4d5863] text-xs leading-relaxed md:text-sm">
											{group.description}
										</p>
									</header>
									<div className={`mt-6 grid gap-7 md:grid-cols-2 md:gap-x-8 md:gap-y-9 ${groupProjects.length > 2 ? "xl:grid-cols-3" : ""}`}>
										{groupProjects.map((project) => {
											const index = displayProjects.findIndex(
												(candidate) => candidate.id === project.id,
											);
							const pageLinks = getProjectPageLinks(project);
							const defaultPage =
								pageLinks.find((link) => link.id === "evidence") ??
								pageLinks[0];

											return (
								<article
									className="portfolio-project-card group relative min-w-0 overflow-hidden border border-transparent transition hover:-translate-y-0.5"
									key={project.id}
								>
									<span className="portfolio-project-number" aria-hidden="true">
										{String(index + 1).padStart(2, "0")}
									</span>
									<div className="portfolio-project-card-body">
										<div className="flex items-start gap-4 pt-8">
											<ProjectIcon projectId={project.id} />
											<div className="min-w-0 pt-1">
												<h3 className="font-bold font-serif text-xl leading-snug md:text-lg">
													{project.title}
												</h3>
												<p className="portfolio-project-summary mt-2 text-[#344252] text-sm leading-relaxed">
													{project.desc}
												</p>
												{project.summaryPoints ? (
													<ul className="portfolio-project-highlights">
														{project.summaryPoints.map((point) => (
															<li key={point}>{point}</li>
														))}
													</ul>
												) : null}
											</div>
										</div>
										<div className="portfolio-project-status absolute top-5 right-5 inline-flex items-center gap-2 border border-[#d8cfbd]/70 bg-[#fbf8ef]/45 px-2.5 py-1.5 font-bold text-xs backdrop-blur-md">
											{project.status === "已完成" ? (
												<CheckCircle2
													aria-hidden="true"
													className="text-[#187044]"
													size={15}
												/>
											) : (
												<Clock3
													aria-hidden="true"
													className="text-[#c29346]"
													size={15}
												/>
											)}
											{project.status}
										</div>
										<div className="portfolio-project-row">
											<p className="font-bold text-xs">工程架构</p>
											<p className="portfolio-project-architecture text-[#344252] text-xs leading-relaxed">
												{project.architecture}
											</p>
										</div>
										<div className="portfolio-project-row">
											<p className="font-bold text-xs">技术栈</p>
											<div className="portfolio-project-skills flex flex-wrap gap-1.5">
												{[
													...new Set([
														...getProjectRenderingModes(project),
														...project.skills,
													]),
												].map((skill) => (
													<span
														className="border border-[#bfc6cc]/80 bg-white/38 px-2.5 py-1 text-xs backdrop-blur-sm"
														key={skill}
													>
														{skill}
													</span>
												))}
											</div>
										</div>
										<div className="portfolio-project-footer">
											<span className="font-bold text-xs">进度</span>
											<span className="font-bold font-serif text-[#b21f35]">
												{project.progress}%
											</span>
											<div className="h-1.5 min-w-12 flex-1 overflow-hidden bg-[#aeb4b7]">
												<div
													className="h-full bg-[#b21f35]"
													style={{
														width: `${Math.min(project.progress, 100)}%`,
													}}
												/>
											</div>
											{defaultPage ? (
												<a
													className="portfolio-project-action relative z-20 font-bold text-xs"
													href={defaultPage.href}
												>
													查看工作证明 →
												</a>
											) : null}
										</div>
										{pageLinks.length > 1 ? (
											<nav
												aria-label={`${project.title} 项目页面`}
												className="portfolio-project-secondary-links relative z-20 flex flex-wrap gap-1.5"
											>
												{pageLinks.map((link) => (
													<a
														aria-label={`${project.title}：${link.label}`}
														className="inline-flex min-h-11 items-center border border-[#9f102a]/45 bg-white/48 px-3 py-2 font-bold text-[#8c1428] text-[11px] backdrop-blur-md"
														href={link.href}
														key={link.id}
													>
														{link.label}
													</a>
												))}
											</nav>
										) : null}
									</div>
								</article>
											);
										})}
									</div>
								</section>
							);
						})}
					</div>
				</div>

				<section className="mt-10 scroll-mt-24 md:mt-14" id="open-source">
					<SectionTitle
						icon={<GitPullRequest aria-hidden="true" size={18} />}
							kicker="Merged & Open"
						title="开源社区共建"
					/>
					<div className="portfolio-dashboard-module-card portfolio-glass-panel mt-5 border border-[#cfd5db] bg-white/84 p-5 shadow-sm md:p-7">
						<p className="max-w-3xl text-[#344252] text-sm leading-relaxed">
							首页展示 Star 数最高的 6 个共建仓库；完整页面提供具体修复内容与 PR / Issue 入口。
						</p>
						<div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
							{openSourceRepositories.slice(0, 6).map((item) => (
								<article
									className="portfolio-glass-subpanel border border-[#e1d8c7] bg-[#fbf8ef] p-4 transition hover:-translate-y-0.5"
									key={item.project}
								>
									<a
										className="flex items-center justify-between gap-3"
										href={item.href}
										rel="noreferrer"
										target="_blank"
									>
										<h3 className="font-semibold font-serif text-base">
											{item.project}
										</h3>
										<span className="shrink-0 text-[#5a6470] text-xs">
											★ {item.stars.toLocaleString("en-US")}
										</span>
									</a>
									<p className="mt-3 text-[#344252] text-xs">
										已合并 {item.merged} · 开放 {item.open}
									</p>
								</article>
							))}
						</div>
					</div>
					<a
						className="mt-5 inline-flex min-h-11 items-center gap-2 border border-[#9f3937]/35 bg-[#fbf8ef]/55 px-4 font-bold text-[#8c1428] text-sm transition duration-300 hover:-translate-y-0.5 hover:bg-[#fbf8ef]/80"
						href="/open-source"
					>
						查看全部开源贡献
						<ArrowUpRight aria-hidden="true" size={16} />
					</a>
				</section>

			</main>

			<footer className="portfolio-glass-footer relative mt-6 border-[#c8c0b0] border-t bg-[#ebe6da]">
				<div
					className={`${PORTFOLIO_FRAME_CLASS} flex min-h-24 flex-col items-center justify-center gap-4 py-7 text-center md:flex-row md:justify-between md:text-left`}
				>
					<div className="flex items-center gap-3 font-bold text-sm">
						<PenTool aria-hidden="true" className="text-[#bf1737]" size={18} />
						<span>TIANCHENG XU · PORTFOLIO</span>
					</div>
					<div className="flex flex-wrap items-center justify-center gap-5 font-bold text-[#3f4650] text-xs tracking-[0.16em]">
						<a
							href="https://github.com/Tiancheng-Xu"
							rel="noreferrer"
							target="_blank"
						>
							GITHUB
						</a>
						<a href="#top">BACK TO TOP</a>
					</div>
					<p className="text-[#5a6470] text-xs">
						© 2026 TIANCHENG XU · ARTISANAL ENGINEERING
					</p>
				</div>
			</footer>

			<div className="portfolio-glass-mobile-nav fixed inset-x-0 bottom-0 z-40 border-[#d8cfbd] border-t bg-[#f7f1e3]/96 px-4 py-2 backdrop-blur md:hidden">
				<PortfolioPrimaryNavigation current="dashboard" />
			</div>
		</div>
	);
}

function ResumeProjectCard({
	block,
}: {
	block: { title: string; meta: string; body?: string; bullets?: string[] };
}) {
	return (
		<article className="portfolio-glass-subpanel border border-[#e1d8c7] bg-[#fbf8ef] p-4">
			<div className="flex items-start gap-3">
				<div className="grid size-11 shrink-0 place-items-center bg-[#eadfcf] text-[#bf1737]">
					<Code2 aria-hidden="true" size={19} />
				</div>
				<div>
					<h4 className="font-semibold font-serif text-base">{block.title}</h4>
					<p className="mt-1 font-bold text-[#3f4650] text-xs">
						{block.meta}
					</p>
				</div>
			</div>
			{block.bullets ? (
				<ul className="mt-3 grid list-disc gap-2 pl-5 text-[#344252] text-sm leading-relaxed marker:text-[#bf1737]">
					{block.bullets.map((bullet) => (
						<li key={bullet}>{bullet}</li>
					))}
				</ul>
			) : (
				<p className="mt-3 text-[#344252] text-sm leading-relaxed">
					{block.body}
				</p>
			)}
		</article>
	);
}

const PROJECT_ICONS = {
	"agent-market": Boxes,
	babysteps: Footprints,
	"shared-evidence-verifier": ShieldCheck,
	"personal-ai-agent": Bot,
	"fullstack-showcase": LayoutDashboard,
	"portfolio-sync": RefreshCw,
	"performance-observability-control": Activity,
	"tc-workflow": Workflow,
} as const;

function ProjectIcon({ projectId }: { projectId: string }) {
	const Icon = PROJECT_ICONS[projectId as keyof typeof PROJECT_ICONS] ?? Code2;
	return (
		<span className="portfolio-project-icon" aria-hidden="true">
			<Icon size={26} strokeWidth={1.8} />
		</span>
	);
}

function SectionTitle({
	icon,
	kicker,
	title,
}: {
	icon: ReactNode;
	kicker: string;
	title: string;
}) {
	return (
		<div className="portfolio-section-title flex items-center gap-3 border-[#d8cfbd] border-b pb-3">
			<span className="text-[#bf1737]">{icon}</span>
			<h2 className="font-bold font-serif text-2xl md:text-xl">{title}</h2>
			<span className="font-bold text-[#4d5863] text-xs uppercase tracking-[0.16em]">
				({kicker})
			</span>
		</div>
	);
}
