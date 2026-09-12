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
import { ProjectArchitecturePreview } from "@/features/portfolio/project-architecture-preview";
import { PortfolioPrimaryNavigation } from "@/features/portfolio/portfolio-primary-navigation";
import { PortfolioVoyageHero } from "@/features/portfolio/portfolio-voyage-hero";
import { TechnologyCapabilityMap } from "@/features/portfolio/technology-capability-map";
import { usePortfolioProjects } from "@/features/portfolio/use-portfolio-projects";

export function DashboardContent() {
	const { projects: visibleProjects, syncedAt } = usePortfolioProjects();

	const preferredProjectOrder = [
		"babysteps",
		"agent-market",
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
			title: "2026 北京兼职项目",
			description:
				"按业务完整度、岗位覆盖面与生产证据排序；仅收录个人仓库中已有实际实现的项目。",
			projectIds: ["babysteps", "agent-market"],
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
			meta: "Aladdin · AI Agent 交易与任务分发平台",
			body: "面向 AI Agent 众包交易场景，构建任务自动拆解、候选 Agent 过滤与评分、人工或自动选定、多阶段生产分发及可审计交付闭环；以 LangGraph DAG、多运行时服务、PostgreSQL Checkpoint、异步队列、信誉评分与 LLM 质量评测处理暂停恢复、冷启动和复杂任务分发。",
		},
		{
			title: "BabySteps",
			meta: "全栈产品、Edge SSR、Web3、AWS 性能观测",
			body: "完成成长任务、家长中心、纪念馆、Provider 与链上交互等产品模块，并建立 Edge SSR、水合降级和真实性能观测链路；难点是隔离身份、钱包和服务端渲染边界。",
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

			<header
				className="portfolio-glass-bar relative border-[#071d34] border-b bg-[#fbf6ea]/92"
				id="top"
			>
				<div
					className={`${PORTFOLIO_FRAME_CLASS} flex h-16 items-center justify-between`}
				>
					<div className="flex min-w-0 items-center gap-3">
						<div
							aria-label="徐天成篆刻姓名章"
							className="portfolio-brand-seal portfolio-name-seal portfolio-glass-control hidden size-11 place-items-center border border-[#bf1737] bg-[#eef0ec] font-bold font-serif text-[#bf1737] md:grid"
							role="img"
						>
							<span aria-hidden="true">
								<i>徐</i>
								<i>天</i>
								<i>成</i>
								<i>印</i>
							</span>
						</div>
						<p className="truncate font-serif text-[#071d34] text-lg md:text-xl">
							<span className="md:hidden">TIANCHENG XU · PORTFOLIO</span>
							<span className="hidden md:flex md:flex-col">
								<strong className="tracking-[0.08em]">
									TIANCHENG XU · PORTFOLIO
								</strong>
								<small className="mt-0.5 font-sans text-[#344252] text-[11px] tracking-[0.18em]">
									徐天成 · 工程作品集
								</small>
							</span>
						</p>
					</div>
					<div className="hidden md:block">
						<PortfolioPrimaryNavigation current="dashboard" />
					</div>
					<div className="flex items-center gap-3">
						<a
							aria-label="Tiancheng Xu GitHub"
							className="portfolio-github-link portfolio-glass-control inline-flex min-h-11 items-center gap-2 border border-[#8d99a3]/45 bg-[#fbf6ea]/30 px-3 font-bold text-[#071d34]"
							href="https://github.com/Tiancheng-Xu"
							rel="noreferrer"
							target="_blank"
						>
							<svg
								aria-hidden="true"
								className="size-5 shrink-0"
								viewBox="0 0 24 24"
							>
								<path
									d="M12 .8a11.3 11.3 0 0 0-3.57 22c.57.1.78-.24.78-.55v-2.18c-3.18.7-3.85-1.35-3.85-1.35-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.53-2.54-.29-5.21-1.27-5.21-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.03 0 0 .96-.31 3.11 1.17a10.8 10.8 0 0 1 5.67 0c2.16-1.48 3.11-1.17 3.11-1.17.62 1.58.23 2.74.11 3.03.74.8 1.18 1.82 1.18 3.07 0 4.4-2.68 5.36-5.22 5.65.41.36.77 1.05.77 2.12v3.15c0 .31.21.66.78.55A11.3 11.3 0 0 0 12 .8Z"
									fill="currentColor"
								/>
							</svg>
							<span className="hidden xl:flex xl:flex-col xl:items-start xl:leading-tight">
								<strong className="text-[11px] tracking-[0.14em]">
									GITHUB
								</strong>
								<small className="font-normal text-[10px] tracking-normal">
									Tiancheng-Xu ↗
								</small>
							</span>
						</a>
					</div>
				</div>
			</header>

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
								2026 北京兼职项目
							</h3>
							<p className="mt-1 text-[#5a6470] text-xs leading-relaxed">
								仅收录个人仓库中已有实际实现的项目；空仓库、模板仓库和仅有规划的项目不列入经历。
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
									<div className="mt-6 grid gap-7 md:grid-cols-2 md:gap-x-8 md:gap-y-9 xl:grid-cols-3">
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
											<p className="font-bold text-xs">架构概览</p>
											<ProjectArchitecturePreview project={project} />
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
						<a href="/evidence">EVIDENCE</a>
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
	block: { title: string; meta: string; body: string };
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
			<p className="mt-3 text-[#344252] text-sm leading-relaxed">
				{block.body}
			</p>
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
