import { useEffect, useState, type ReactNode } from "react";
import {
	ArrowRight,
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

import {
	getProjectRenderingModes,
	PORTFOLIO_PROJECTS,
} from "@/data/portfolio-projects";
import { resolvePerformanceView } from "@/features/performance/performance-state";
import { PerformanceStatusCard } from "@/features/performance/performance-status-card";
import {
	loadSyncedPortfolio,
	mergePortfolioProjects,
} from "@/data/portfolio-sync";

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
		sections.forEach((section) => observer.observe(section));
		return () => observer.disconnect();
	}, []);

	const performanceProjects = visibleProjects.filter(
		(project) => project.performance,
	);
	const skillGroups = [
		{
			name: "React / TypeScript",
			source: "GitHub Profile Studio、Showcase Dashboard",
		},
		{
			name: "LLM / RAG",
			source: "Personal AI Agent",
		},
		{
			name: "Cloudflare Pages",
			source: "Baby2B Deployment Evidence",
		},
		{
			name: "TC Flow",
			source: "TC Workflow",
		},
		{
			name: "CI/CD Evidence",
			source: "部署日志、验证记录、回滚材料",
		},
		{
			name: "PostgreSQL",
			source: "Fullstack / 数据链路项目经验",
		},
	];

	const resumeBlocks = [
		{
			title: "Personal AI Agent",
			meta: "LLM 编排、RAG、QLoRA",
			body: "把模型微调、检索增强和外部工具适配拆成可复用链路；难点在于实验代码到可解释推理流程之间的边界整理。",
		},
		{
			title: "GitHub Profile Studio",
			meta: "React、TypeScript、数据驱动页面",
			body: "用路由、卡片模型和 evidence 数据索引组织作品展示；难点在于保持项目叙事、证据入口和响应式界面一致。",
		},
		{
			title: "Baby2B Deployment Evidence",
			meta: "Cloudflare Pages、发布验证、日志归档",
			body: "沉淀部署过程、验证结果和回滚记录；难点在于让公开证据与真实发布动作对应，避免不可复现的展示材料。",
		},
		{
			title: "TC Workflow",
			meta: "任务编排、上下文治理、验收闭环",
			body: "围绕任务拆分、检查点和交付证据建立工作流；难点在于把执行过程转成可审查、可恢复的工程记录。",
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

			<header className="relative border-[#071d34] border-b bg-[#fbf6ea]/92" id="top">
				<div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-8">
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
						<p className="truncate font-serif text-lg text-[#071d34] md:text-xl">
							<span className="md:hidden">UKIYO-E PORTFOLIO</span>
							<span className="hidden md:inline">Tiancheng Xu Portfolio</span>
						</p>
					</div>
					<nav aria-label="作品集主导航" className="hidden items-center gap-2 font-bold text-[12px] tracking-[0.15em] md:flex">
						<a aria-current="page" className="inline-flex min-h-11 items-center border border-[#bf1737] bg-[#bf1737] px-4 text-white shadow-[3px_3px_0_#071d34]" href="#top">DASHBOARD</a>
						<a className="inline-flex min-h-11 items-center border border-[#c8bda9] bg-[#fbf6ea] px-4 text-[#344252] transition hover:border-[#bf1737] hover:bg-[#f3e7d7] hover:text-[#9f102a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#bf1737]" href="#projects">PROJECTS</a>
						<a className="inline-flex min-h-11 items-center border border-[#c8bda9] bg-[#fbf6ea] px-4 text-[#344252] transition hover:border-[#bf1737] hover:bg-[#f3e7d7] hover:text-[#9f102a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#bf1737]" href="https://evidence.baby2b.online/">EVIDENCE</a>
					</nav>
					<div className="flex items-center gap-3">
						<Search aria-hidden="true" className="hidden md:block" size={24} />
						<a aria-label="Tiancheng Xu GitHub" className="grid size-11 place-items-center rounded-full border border-[#d9ccb5] bg-[#fbf6ea] md:size-10" href="https://github.com/Tiancheng-Xu" rel="noreferrer" target="_blank">
							<UserRound aria-hidden="true" size={22} />
						</a>
					</div>
				</div>
			</header>

			<main className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 md:py-12">
				<section className="mx-auto max-w-3xl scroll-mt-24 text-center" id="about">
					<p className="font-serif text-sm">作品看板 Dashboard</p>
					<h1 className="mt-3 font-serif font-bold text-3xl leading-tight md:text-4xl">
						Showcase Dashboard
					</h1>
					<p className="mt-2 font-bold text-sm text-[#3f4650]">
						作者：Tiancheng Xu（Tiancheng-Xu）
					</p>
					<p className="mx-auto mt-5 border-l-4 border-[#bf1737] bg-[#fbf8ef]/78 px-5 py-4 text-left text-base leading-relaxed shadow-[inset_0_0_0_1px_rgba(7,29,52,0.16)] md:border-l-0 md:bg-transparent md:text-center md:shadow-none">
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
											<h3 className="font-serif font-semibold text-base">
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
							观测链路停止或故障时，只展示最后一次通过校验的真实快照；没有可信快照时明确显示无数据。启停入口进入受保护控制面，不直接暴露 AWS 管理权限。
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
						{visibleProjects.map((project, index) => (
							<a
								className="group block min-w-0 overflow-hidden border border-[#c7ced8] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#bf1737]/50 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#bf1737]"
								href={`/evidence/${project.id}`}
								key={project.id}
							>
								<div
									className={`relative h-44 overflow-hidden bg-gradient-to-br ${visualThemes[index % visualThemes.length]} md:h-48`}
								>
									<div className="absolute inset-0 opacity-75 mix-blend-multiply [background-image:radial-gradient(circle_at_18%_28%,rgba(255,255,255,.75)_0_8%,transparent_9%),linear-gradient(135deg,transparent_0_38%,rgba(255,255,255,.52)_39%_42%,transparent_43%),repeating-linear-gradient(165deg,rgba(7,29,52,.22)_0_2px,transparent_2px_18px)]" />
									<div className="absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(135deg,rgba(255,255,255,.72)_0_12%,transparent_12%_18%,rgba(7,29,52,.18)_18%_19%,transparent_19%_30%,rgba(255,255,255,.42)_30%_44%,transparent_45%)]" />
									<div className="absolute right-4 top-4 inline-flex min-h-11 items-center gap-2 border border-[#d8cfbd] bg-[#fbf8ef]/94 px-3 py-2 font-bold text-xs shadow-sm">
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
										<h3 className="font-serif font-bold text-xl leading-snug md:text-lg">
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
									{getProjectRenderingModes(project).length > 0 ? (
										<div className="flex flex-wrap items-center gap-2" aria-label="渲染模式">
											<span className="font-bold text-[#5b6570] text-[11px] tracking-[0.12em]">
												RENDERING
											</span>
											{getProjectRenderingModes(project).map((mode) => (
												<span
													className="border border-[#0f2d4d] bg-[#eaf0f1] px-2.5 py-1 font-bold text-[#0f2d4d] text-xs"
													key={mode}
												>
													{mode}
												</span>
											))}
										</div>
									) : null}
									<div className="flex flex-wrap gap-2">
										{project.skills.map((skill) => (
											<span
												className="border border-[#d8cfbd] bg-[#fbf8ef] px-2.5 py-1 text-xs"
												key={skill}
											>
												{skill}
											</span>
										))}
									</div>
									<div className="flex min-h-11 items-center justify-center gap-2 bg-[#bf1737] px-4 py-3 font-bold text-sm text-white transition group-hover:bg-[#a7122d]">
										查看完整工作证明
										<ArrowRight aria-hidden="true" size={16} />
									</div>
								</div>
							</a>
						))}
					</div>
				</section>
			</main>

			<footer className="relative mt-6 border-[#c8c0b0] border-t bg-[#ebe6da]">
				<div className="mx-auto flex min-h-24 w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 py-7 text-center sm:px-8 md:flex-row md:justify-between md:text-left">
					<div className="flex items-center gap-3 font-bold text-sm">
						<PenTool aria-hidden="true" className="text-[#bf1737]" size={18} />
						<span>UKIYO-E PORTFOLIO · TIANCHENG XU</span>
					</div>
					<div className="flex flex-wrap items-center justify-center gap-5 font-bold text-xs tracking-[0.16em] text-[#3f4650]">
						<a href="https://github.com/Tiancheng-Xu" rel="noreferrer" target="_blank">GITHUB</a>
						<a href="https://evidence.baby2b.online/">EVIDENCE</a>
						<a href="#top">BACK TO TOP</a>
					</div>
					<p className="text-[#5a6470] text-xs">© 2026 TIANCHENG XU · ARTISANAL ENGINEERING</p>
				</div>
			</footer>

			<nav
				aria-label="作品集快捷导航"
				className="fixed inset-x-0 bottom-0 z-40 border-[#d8cfbd] border-t bg-[#f7f1e3]/96 px-6 py-2 backdrop-blur md:hidden"
			>
				<div className="mx-auto grid max-w-md grid-cols-4 gap-1">
						{[
						{ id: "projects", label: "Works", icon: PenTool, href: "#projects" },
						{ id: "about", label: "About", icon: UserRound, href: "#about" },
						{ id: "skills", label: "Skills", icon: Compass, href: "#skills" },
						{ id: "proof", label: "Proof", icon: BadgeCheck, href: "https://evidence.baby2b.online/" },
					].map(({ id, href, icon: Icon, label }) => (
						<a
							aria-current={activeSection === id ? "location" : undefined}
							className={`flex min-h-14 flex-col items-center justify-center gap-1 border px-1 text-[11px] font-bold transition ${
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
			<h2 className="font-serif font-bold text-2xl md:text-xl">{title}</h2>
			<span className="font-bold text-[#4d5863] text-xs uppercase tracking-[0.16em]">
				({kicker})
			</span>
		</div>
	);
}
