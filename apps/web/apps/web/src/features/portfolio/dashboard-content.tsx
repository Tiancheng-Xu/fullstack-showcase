import {
	Activity,
	BadgeCheck,
	Bot,
	Boxes,
	CheckCircle2,
	Clock3,
	Code2,
	Compass,
	Footprints,
	LayoutDashboard,
	LayoutGrid,
	Menu,
	PenTool,
	RefreshCw,
	ShieldCheck,
	UserRound,
	Workflow,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

import {
	getProjectPageLinks,
	getProjectRenderingModes,
	PORTFOLIO_PROJECTS,
} from "@/data/portfolio-projects";
import {
	loadSyncedPortfolio,
	mergePortfolioProjects,
} from "@/data/portfolio-sync";
import { resolvePerformanceView } from "@/features/performance/performance-state";
import { PerformanceStatusCard } from "@/features/performance/performance-status-card";
import { PORTFOLIO_FRAME_CLASS } from "@/features/portfolio/portfolio-layout";

export function DashboardContent() {
	const [visibleProjects, setVisibleProjects] = useState(PORTFOLIO_PROJECTS);
	const [syncedAt, setSyncedAt] = useState<string | null>(null);
	const [activeSection, setActiveSection] = useState("projects");

	useEffect(() => {
		const controller = new AbortController();
		loadSyncedPortfolio(controller.signal)
			.then((envelope) => {
				setVisibleProjects(
					mergePortfolioProjects(PORTFOLIO_PROJECTS, envelope.projects),
				);
				setSyncedAt(envelope.generatedAt);
			})
			.catch(() => {
				// Keep the reviewed static index when sync is unavailable.
			});
		return () => controller.abort();
	}, []);

	useEffect(() => {
		if (typeof IntersectionObserver === "undefined") return;
		const sections = ["about", "skills", "projects"]
			.map((id) => document.getElementById(id))
			.filter((section): section is HTMLElement => Boolean(section));
		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((entry) => entry.isIntersecting)
					.sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
				if (visible?.target.id) setActiveSection(visible.target.id);
			},
			{ rootMargin: "-22% 0px -58%", threshold: [0.05, 0.25, 0.5] },
		);
		sections.forEach((section) => {
			observer.observe(section);
		});
		return () => observer.disconnect();
	}, []);

	const performanceProjects = visibleProjects.filter(
		(project) => project.performance,
	);
	const preferredProjectOrder = [
		"agent-market",
		"babysteps",
		"shared-evidence-verifier",
		"personal-ai-agent",
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
	const skillGroups = [
		{
			name: "全栈产品工程",
			source: "BabySteps、Agent Market、GitHub Profile Studio",
		},
		{
			name: "AI / Agent 工程",
			source: "Personal AI Agent、Agent Market",
		},
		{
			name: "Web3 / 可验证交付",
			source: "Agent Market、BabySteps",
		},
		{
			name: "Cloud / Edge / CI/CD",
			source: "Showcase Dashboard、Portfolio Sync、BabySteps",
		},
		{
			name: "性能观测与数据链路",
			source: "性能观测与成本控制、BabySteps",
		},
		{
			name: "工作流与质量 Gate",
			source: "TC Flow 2.1、Portfolio Sync、Evidence",
		},
	];

	const resumeBlocks = [
		{
			title: "BabySteps",
			meta: "全栈产品、Edge SSR、Web3、AWS 性能观测",
			body: "完成成长任务、家长中心、纪念馆、Provider 与链上交互等产品模块，并建立 Edge SSR、水合降级和真实性能观测链路；难点是隔离身份、钱包和服务端渲染边界。",
		},
		{
			title: "Agent Market",
			meta: "AI Agents、LangGraph、Sepolia、Cloudflare",
			body: "构建可验证 AI Agent 任务市场，覆盖标签匹配、多 Agent DAG、任务协作与链上状态锚定；难点是让本地编排、公开生产页面和 24 笔 Sepolia Evidence 保持同一事实边界。",
		},
		{
			title: "Personal AI Agent",
			meta: "Qwen3-8B、QLoRA / NF4、GGUF、Ollama",
			body: "完成双卡 QLoRA 微调、冻结集对照、模型合并和 GGUF 量化，形成 Mac/Ollama 离线交付；难点是训练结果、模型身份和可复现验收之间的证据闭环。",
		},
		{
			title: "Showcase Dashboard",
			meta: "React、TypeScript、SSG / Hydration、Cloudflare Pages",
			body: "把项目状态、Evidence、性能控制与自动同步整合为统一作品集入口；难点是保持静态首屏、水合后数据和项目自有页面链接一致，并让未知路由返回真实 404。",
		},
		{
			title: "GitHub Profile Studio",
			meta: "React、TanStack Router、Hono / Go、SQLite",
			body: "构建本地优先的 GitHub 公开资料工作台，支持前端与双后端运行方式；难点是 GitHub API、数据缓存、凭据安全和本地交付体验之间的协调。",
		},
		{
			title: "Portfolio Sync",
			meta: "GitHub App、Webhook、Cloudflare Workers、KV",
			body: "通过签名 Webhook、只读 Installation Token 和定时兜底同步作品集项目清单；难点是跨仓库可信更新、失败降级和 Dashboard 静态基线的一致性。",
		},
		{
			title: "性能观测与成本控制",
			meta: "RUM、SQS / ECS、PostgreSQL、受保护控制面",
			body: "集中展示各项目性能指标、可信历史快照和成本控制状态；难点是区分真实用户、受控浏览器与历史快照，并在临时 AWS 链路关闭后保持诚实降级。",
		},
		{
			title: "TC Flow 2.1",
			meta: "N1-N8、检查点、Review Gate、Evidence",
			body: "把需求、实现、审查、修复和发布拆成可恢复的 N1-N8 流程，沉淀本地与远端 Gate；难点是让复杂任务在失败、续跑和多人协作时仍保持可审查状态。",
		},
	];

	return (
		<div className="portfolio-surface relative left-1/2 w-screen max-w-none -translate-x-1/2 overflow-x-hidden bg-[#f7f1e3] text-[#071d34]">
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
				<div className={`${PORTFOLIO_FRAME_CLASS} flex h-16 items-center justify-between`}>
						<div className="flex min-w-0 items-center gap-3">
						<button
							aria-label="打开菜单"
							className="grid size-11 place-items-center text-[#071d34] md:hidden"
							type="button"
						>
							<Menu aria-hidden="true" size={23} />
						</button>
					<div aria-label="徐天成篆刻姓名章" className="portfolio-brand-seal portfolio-name-seal portfolio-glass-control hidden size-11 place-items-center border border-[#bf1737] bg-[#eef0ec] font-serif font-bold text-[#bf1737] md:grid">
						<span aria-hidden="true"><i>徐</i><i>天</i><i>成</i><i>印</i></span>
						</div>
						<p className="truncate font-serif text-[#071d34] text-lg md:text-xl">
							<span className="md:hidden">UKIYO-E PORTFOLIO</span>
							<span className="hidden md:flex md:flex-col">
								<strong className="tracking-[0.08em]">TIANCHENG XU · PORTFOLIO</strong>
								<small className="mt-0.5 font-sans text-[#344252] text-[11px] tracking-[0.18em]">徐天成 · 工程作品集</small>
							</span>
						</p>
					</div>
					<nav
						aria-label="作品集主导航"
						className="portfolio-primary-nav hidden items-center gap-2 font-bold text-[12px] tracking-[0.15em] md:flex"
					>
						<a
							aria-current="page"
							className="inline-flex min-h-11 items-center border border-[#bf1737] bg-[#bf1737] px-4 text-white shadow-[3px_3px_0_#071d34]"
							href="#top"
						>
							作品集首页
						</a>
						<a
							className="inline-flex min-h-11 items-center border border-[#c8bda9] bg-[#fbf6ea] px-4 text-[#344252] transition hover:border-[#bf1737] hover:bg-[#f3e7d7] hover:text-[#9f102a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bf1737] focus-visible:outline-offset-3"
							href="#projects"
						>
							项目
						</a>
						<a
							className="inline-flex min-h-11 items-center border border-[#c8bda9] bg-[#fbf6ea] px-4 text-[#344252] transition hover:border-[#bf1737] hover:bg-[#f3e7d7] hover:text-[#9f102a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bf1737] focus-visible:outline-offset-3"
							href="/dashboard#projects"
						>
							工作证明
						</a>
					</nav>
					<div className="flex items-center gap-3">
						<a
							aria-label="Tiancheng Xu GitHub"
							className="portfolio-github-link portfolio-glass-control inline-flex min-h-11 items-center gap-2 border border-[#8d99a3]/45 bg-[#fbf6ea]/30 px-3 font-bold text-[#071d34]"
							href="https://github.com/Tiancheng-Xu"
							rel="noreferrer"
							target="_blank"
						>
							<svg aria-hidden="true" className="size-5 shrink-0" viewBox="0 0 24 24">
								<path d="M12 .8a11.3 11.3 0 0 0-3.57 22c.57.1.78-.24.78-.55v-2.18c-3.18.7-3.85-1.35-3.85-1.35-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.53-2.54-.29-5.21-1.27-5.21-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.03 0 0 .96-.31 3.11 1.17a10.8 10.8 0 0 1 5.67 0c2.16-1.48 3.11-1.17 3.11-1.17.62 1.58.23 2.74.11 3.03.74.8 1.18 1.82 1.18 3.07 0 4.4-2.68 5.36-5.22 5.65.41.36.77 1.05.77 2.12v3.15c0 .31.21.66.78.55A11.3 11.3 0 0 0 12 .8Z" fill="currentColor" />
							</svg>
							<span className="hidden xl:flex xl:flex-col xl:items-start xl:leading-tight">
								<strong className="text-[11px] tracking-[0.14em]">GITHUB</strong>
								<small className="font-normal text-[10px] tracking-normal">Tiancheng-Xu ↗</small>
							</span>
						</a>
					</div>
				</div>
			</header>

			<main className={`${PORTFOLIO_FRAME_CLASS} portfolio-dashboard-main relative py-8 md:py-12`}>
				<section
					className="portfolio-dashboard-hero max-w-4xl scroll-mt-24 text-left"
					id="about"
				>
					<h1 className="font-bold font-serif text-4xl leading-tight md:text-6xl">
						展示看板
					</h1>
					<p className="mt-2 font-serif text-[#344252] text-base tracking-[0.08em]">SHOWCASE DASHBOARD</p>
					<p className="sr-only">
						作者：Tiancheng Xu（Tiancheng-Xu）
					</p>
					<p className="mt-5 max-w-3xl border-[#bf1737] border-t pt-4 text-left text-[#344252] text-sm leading-relaxed">
						精选工程项目速览，包含架构、技术栈与进度概览。
					</p>
				</section>

				<section className="mt-10 scroll-mt-24 md:mt-14" id="skills">
					<SectionTitle
						icon={<Compass aria-hidden="true" size={18} />}
						kicker="Core Competencies"
						title="个人简历"
					/>
					<div className="portfolio-dashboard-module-card portfolio-glass-panel mt-5 border border-[#cfd5db] bg-white/84 p-5 shadow-sm md:p-8">
						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{skillGroups.map((skill) => (
								<div
									className="portfolio-glass-subpanel min-h-16 border border-[#d8cfbd] bg-[#f8f3e8] px-4 py-3"
									key={skill.name}
								>
									<p className="font-bold text-sm">{skill.name}</p>
									<p className="mt-1 text-[#4d5863] text-xs leading-relaxed">
										{skill.source}
									</p>
								</div>
							))}
						</div>
						<div className="mt-6 grid gap-4 md:grid-cols-2">
							{resumeBlocks.map((block) => (
								<article
									className="portfolio-glass-subpanel border border-[#e1d8c7] bg-[#fbf8ef] p-4"
									key={block.title}
								>
									<div className="flex items-start gap-3">
										<div className="grid size-11 shrink-0 place-items-center bg-[#eadfcf] text-[#bf1737]">
											<Code2 aria-hidden="true" size={19} />
										</div>
										<div>
											<h3 className="font-semibold font-serif text-base">
												{block.title}
											</h3>
											<p className="mt-1 font-bold text-[#3f4650] text-xs">
												{block.meta}
											</p>
										</div>
									</div>
									<p className="mt-3 text-[#344252] text-sm leading-relaxed">
										{block.body}
									</p>
								</article>
							))}
						</div>
					</div>
				</section>

				{performanceProjects.length > 0 ? (
					<section className="mt-10 scroll-mt-24 md:mt-14" id="performance">
						<SectionTitle
							icon={<BadgeCheck aria-hidden="true" size={18} />}
							kicker="Verified Snapshot"
							title="性能观测与成本控制"
						/>
						<div className="portfolio-dashboard-module-card mt-5 p-5 md:p-7">
							<p className="max-w-3xl text-[#344252] text-sm leading-relaxed">
								观测链路停止或故障时，只展示最后一次通过校验的真实快照；没有可信快照时明确显示无数据。启停入口进入受保护控制面，不直接暴露
								AWS 管理权限。
							</p>
							<div className="mt-5 grid gap-5">
							{performanceProjects.map((project) => {
								const performance = project.performance;
								if (!performance) return null;

								return (
									<PerformanceStatusCard
										key={project.id}
										projectId={project.id}
										projectName={project.title}
										status={resolvePerformanceView(performance)}
									/>
								);
							})}
							</div>
						</div>
					</section>
				) : null}

				<section className="mt-10 scroll-mt-24 md:mt-14" id="projects">
					<div className="sr-only">
						<SectionTitle
							icon={<LayoutGrid aria-hidden="true" size={18} />}
							kicker="Project Portfolio"
							title="项目列表"
						/>
					</div>
					<p className="sr-only">
						{syncedAt
							? "GitHub App 自动同步 · " +
								new Date(syncedAt).toLocaleString("zh-CN")
							: "GitHub App 即时同步 · 静态项目索引兜底"}
					</p>
					<div className="mt-6 grid gap-7 md:grid-cols-2 md:gap-x-8 md:gap-y-9 xl:grid-cols-3">
						{displayProjects.map((project, index) => {
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
									{defaultPage ? (
										<a
											aria-label={`查看 ${project.title} 工作证明`}
											className="absolute inset-0 z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bf1737] focus-visible:outline-offset-[-4px]"
											href={defaultPage.href}
										>
											<span className="sr-only">
												查看 {project.title} 工作证明
											</span>
										</a>
									) : null}
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
											<span className="font-serif font-bold text-[#b21f35]">{project.progress}%</span>
											<div className="h-1.5 min-w-12 flex-1 overflow-hidden bg-[#aeb4b7]">
												<div className="h-full bg-[#b21f35]" style={{ width: `${Math.min(project.progress, 100)}%` }} />
											</div>
											<span className="portfolio-project-action font-bold text-xs">查看工作证明 →</span>
										</div>
										{pageLinks.length > 1 ? (
											<nav aria-label={`${project.title} 项目页面`} className="portfolio-project-secondary-links relative z-20 flex flex-wrap gap-1.5">
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
			</main>

			<footer className="portfolio-glass-footer relative mt-6 border-[#c8c0b0] border-t bg-[#ebe6da]">
				<div className={`${PORTFOLIO_FRAME_CLASS} flex min-h-24 flex-col items-center justify-center gap-4 py-7 text-center md:flex-row md:justify-between md:text-left`}>
					<div className="flex items-center gap-3 font-bold text-sm">
						<PenTool aria-hidden="true" className="text-[#bf1737]" size={18} />
						<span>UKIYO-E PORTFOLIO · TIANCHENG XU</span>
					</div>
					<div className="flex flex-wrap items-center justify-center gap-5 font-bold text-[#3f4650] text-xs tracking-[0.16em]">
						<a
							href="https://github.com/Tiancheng-Xu"
							rel="noreferrer"
							target="_blank"
						>
							GITHUB
						</a>
						<a href="/dashboard#projects">EVIDENCE</a>
						<a href="#top">BACK TO TOP</a>
					</div>
					<p className="text-[#5a6470] text-xs">
						© 2026 TIANCHENG XU · ARTISANAL ENGINEERING
					</p>
				</div>
			</footer>

			<nav
				aria-label="作品集快捷导航"
				className="portfolio-glass-mobile-nav fixed inset-x-0 bottom-0 z-40 border-[#d8cfbd] border-t bg-[#f7f1e3]/96 px-6 py-2 backdrop-blur md:hidden"
			>
				<div className="mx-auto grid max-w-md grid-cols-4 gap-1">
					{[
						{
							id: "projects",
							label: "Works",
							icon: PenTool,
							href: "#projects",
						},
						{ id: "about", label: "About", icon: UserRound, href: "#about" },
						{ id: "skills", label: "Skills", icon: Compass, href: "#skills" },
						{
							id: "proof",
							label: "Proof",
							icon: BadgeCheck,
							href: "/dashboard#projects",
						},
					].map(({ id, href, icon: Icon, label }) => (
						<a
							aria-current={activeSection === id ? "location" : undefined}
							className={`flex min-h-14 flex-col items-center justify-center gap-1 border px-1 font-bold text-[11px] transition ${
								activeSection === id
									? "border-[#bf1737] bg-[#bf1737] text-white shadow-[2px_2px_0_#071d34]"
									: "border-[#d8cfbd] bg-[#fbf6ea] text-[#4d5863] hover:border-[#bf1737] hover:bg-[#f3e7d7]"
							}`}
							href={href}
							key={label}
							onClick={() => {
								if (id !== "proof") setActiveSection(id);
							}}
						>
							<Icon aria-hidden="true" size={19} />
							<span>{label}</span>
						</a>
					))}
				</div>
			</nav>
		</div>
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
