import {
	BadgeCheck,
	CheckCircle2,
	Clock3,
	Code2,
	Compass,
	LayoutGrid,
	Menu,
	PenTool,
	Search,
	UserRound,
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

	const visualThemes = [
		"from-[#dfe7e3] via-[#c7d8dd] to-[#b82139]",
		"from-[#efe8d6] via-[#d9d3be] to-[#0f2d4d]",
		"from-[#dde8ec] via-[#c6d1bc] to-[#c29346]",
		"from-[#ece0cf] via-[#d6c8ad] to-[#15385f]",
	];

	return (
		<div className="relative left-1/2 w-screen max-w-none -translate-x-1/2 overflow-x-hidden bg-[#f7f1e3] text-[#071d34]">
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
				className="relative border-[#071d34] border-b bg-[#fbf6ea]/92"
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
						<div className="hidden size-9 place-items-center border border-[#d9ccb5] bg-[#eef0ec] text-[#071d34] md:grid">
							<PenTool aria-hidden="true" size={16} />
						</div>
						<p className="truncate font-serif text-[#071d34] text-lg md:text-xl">
							<span className="md:hidden">UKIYO-E PORTFOLIO</span>
							<span className="hidden md:inline">Tiancheng Xu Portfolio</span>
						</p>
					</div>
					<nav
						aria-label="作品集主导航"
						className="hidden items-center gap-2 font-bold text-[12px] tracking-[0.15em] md:flex"
					>
						<a
							aria-current="page"
							className="inline-flex min-h-11 items-center border border-[#bf1737] bg-[#bf1737] px-4 text-white shadow-[3px_3px_0_#071d34]"
							href="#top"
						>
							DASHBOARD
						</a>
						<a
							className="inline-flex min-h-11 items-center border border-[#c8bda9] bg-[#fbf6ea] px-4 text-[#344252] transition hover:border-[#bf1737] hover:bg-[#f3e7d7] hover:text-[#9f102a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bf1737] focus-visible:outline-offset-3"
							href="#projects"
						>
							PROJECTS
						</a>
						<a
							className="inline-flex min-h-11 items-center border border-[#c8bda9] bg-[#fbf6ea] px-4 text-[#344252] transition hover:border-[#bf1737] hover:bg-[#f3e7d7] hover:text-[#9f102a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bf1737] focus-visible:outline-offset-3"
							href="/dashboard#projects"
						>
							EVIDENCE
						</a>
					</nav>
					<div className="flex items-center gap-3">
						<Search aria-hidden="true" className="hidden md:block" size={24} />
						<a
							aria-label="Tiancheng Xu GitHub"
							className="grid size-11 place-items-center rounded-full border border-[#d9ccb5] bg-[#fbf6ea] md:size-10"
							href="https://github.com/Tiancheng-Xu"
							rel="noreferrer"
							target="_blank"
						>
							<UserRound aria-hidden="true" size={22} />
						</a>
					</div>
				</div>
			</header>

			<main className={`${PORTFOLIO_FRAME_CLASS} relative py-8 md:py-12`}>
				<section
					className="mx-auto max-w-3xl scroll-mt-24 text-center"
					id="about"
				>
					<p className="font-serif text-sm">作品看板 Dashboard</p>
					<h1 className="mt-3 font-bold font-serif text-3xl leading-tight md:text-4xl">
						Showcase Dashboard
					</h1>
					<p className="mt-2 font-bold text-[#3f4650] text-sm">
						作者：Tiancheng Xu（Tiancheng-Xu）
					</p>
					<p className="mx-auto mt-5 border-[#bf1737] border-l-4 bg-[#fbf8ef]/78 px-5 py-4 text-left text-base leading-relaxed shadow-[inset_0_0_0_1px_rgba(7,29,52,0.16)] md:border-l-0 md:bg-transparent md:text-center md:shadow-none">
						全栈开发工程师，专注于构建可闭环追溯的高质量技术方案与自动化工作流。
					</p>
				</section>

				<section className="mt-10 scroll-mt-24 md:mt-14" id="skills">
					<SectionTitle
						icon={<Compass aria-hidden="true" size={18} />}
						kicker="Core Competencies"
						title="个人简历"
					/>
					<div className="mt-5 border border-[#cfd5db] bg-white/84 p-5 shadow-sm md:p-8">
						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{skillGroups.map((skill) => (
								<div
									className="min-h-16 border border-[#d8cfbd] bg-[#f8f3e8] px-4 py-3"
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
									className="border border-[#e1d8c7] bg-[#fbf8ef] p-4"
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
						<p className="mt-4 max-w-3xl text-[#344252] text-sm leading-relaxed">
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
					</section>
				) : null}

				<section className="mt-10 scroll-mt-24 md:mt-14" id="projects">
					<SectionTitle
						icon={<LayoutGrid aria-hidden="true" size={18} />}
						kicker="Project Portfolio"
						title="项目列表"
					/>
					<p className="mt-3 text-[#59636d] text-xs">
						{syncedAt
							? "GitHub App 自动同步 · " +
								new Date(syncedAt).toLocaleString("zh-CN")
							: "GitHub App 即时同步 · 静态项目索引兜底"}
					</p>
					<div className="mt-6 grid gap-7 md:grid-cols-2 md:gap-x-8 md:gap-y-9">
						{visibleProjects.map((project, index) => {
							const pageLinks = getProjectPageLinks(project);
							const defaultPage =
								pageLinks.find((link) => link.id === "evidence") ??
								pageLinks[0];

							return (
								<article
									className="group relative min-w-0 overflow-hidden border border-[#c7ced8] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#bf1737]/50 hover:shadow-md"
									key={project.id}
								>
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
									<div
										className={`relative h-44 overflow-hidden bg-gradient-to-br ${visualThemes[index % visualThemes.length]} md:h-48`}
									>
										<div className="absolute inset-0 opacity-75 mix-blend-multiply [background-image:radial-gradient(circle_at_18%_28%,rgba(255,255,255,.75)_0_8%,transparent_9%),linear-gradient(135deg,transparent_0_38%,rgba(255,255,255,.52)_39%_42%,transparent_43%),repeating-linear-gradient(165deg,rgba(7,29,52,.22)_0_2px,transparent_2px_18px)]" />
										<div className="absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(135deg,rgba(255,255,255,.72)_0_12%,transparent_12%_18%,rgba(7,29,52,.18)_18%_19%,transparent_19%_30%,rgba(255,255,255,.42)_30%_44%,transparent_45%)]" />
										<div className="absolute top-4 right-4 inline-flex min-h-11 items-center gap-2 border border-[#d8cfbd] bg-[#fbf8ef]/94 px-3 py-2 font-bold text-xs shadow-sm">
											{project.status === "已完成" ? (
												<CheckCircle2
													aria-hidden="true"
													className="text-[#bf1737]"
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
									</div>
									<div className="space-y-5 p-5 md:p-6">
										<div>
											<h3 className="font-bold font-serif text-xl leading-snug md:text-lg">
												{project.title}
											</h3>
											<p className="mt-3 text-[#344252] text-sm leading-relaxed">
												{project.desc}
											</p>
										</div>
										<div className="space-y-2">
											<div className="flex items-center gap-3">
												<div className="h-1.5 min-w-0 flex-1 overflow-hidden bg-[#aeb4b7]">
													<div
														className="h-full bg-[#0f2d4d]"
														style={{
															width: `${Math.min(project.progress, 100)}%`,
														}}
													/>
												</div>
												<span className="min-w-11 text-right font-bold text-sm">
													{project.progress}%
												</span>
											</div>
										</div>
										<div className="border border-[#e1d8c7] bg-[#f8f3e8] p-4">
											<p className="font-bold text-xs">项目架构：</p>
											<p className="mt-2 text-[#344252] text-sm leading-relaxed">
												{project.architecture}
											</p>
										</div>
										<div className="flex flex-wrap gap-2">
											{[
												...new Set([
													...getProjectRenderingModes(project),
													...project.skills,
												]),
											].map((skill) => (
												<span
													className="border border-[#d8cfbd] bg-[#fbf8ef] px-2.5 py-1 text-xs"
													key={skill}
												>
													{skill}
												</span>
											))}
										</div>
										{pageLinks.length > 0 ? (
											<nav
												aria-label={`${project.title} 项目页面`}
												className="relative z-20 flex flex-wrap gap-2"
											>
												{pageLinks.map((link) => (
													<a
														aria-label={`${project.title}：${link.label}`}
														className="inline-flex min-h-11 items-center border border-[#bf1737] bg-[#fbf8ef] px-3 py-2 font-bold text-[#9f102a] text-xs transition hover:bg-[#bf1737] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#071d34] focus-visible:outline-offset-2"
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

			<footer className="relative mt-6 border-[#c8c0b0] border-t bg-[#ebe6da]">
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
				className="fixed inset-x-0 bottom-0 z-40 border-[#d8cfbd] border-t bg-[#f7f1e3]/96 px-6 py-2 backdrop-blur md:hidden"
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
		<div className="flex items-center gap-3 border-[#d8cfbd] border-b pb-3">
			<span className="text-[#bf1737]">{icon}</span>
			<h2 className="font-bold font-serif text-2xl md:text-xl">{title}</h2>
			<span className="font-bold text-[#4d5863] text-xs uppercase tracking-[0.16em]">
				({kicker})
			</span>
		</div>
	);
}
