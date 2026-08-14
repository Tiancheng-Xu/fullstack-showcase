import { BadgeCheck, LayoutGrid, PenTool, UserRound } from "lucide-react";
import type { ReactNode } from "react";

type PortfolioPage = "portfolio" | "project" | "evidence";

export function PortfolioPageShell({
	children,
	current,
	description,
	evidenceUrl,
	eyebrow,
	projectHomeUrl,
	title,
}: {
	children: ReactNode;
	current: PortfolioPage;
	description: string;
	evidenceUrl: string;
	eyebrow: string;
	projectHomeUrl: string;
	title: string;
}) {
	const links = [
		{ id: "portfolio" as const, href: "/dashboard", label: "作品集首页", icon: LayoutGrid },
		{ id: "project" as const, href: projectHomeUrl, label: "项目主页", icon: UserRound },
		{ id: "evidence" as const, href: evidenceUrl, label: "工作证明", icon: BadgeCheck },
	];

	return (
		<div className="relative left-1/2 min-h-screen w-screen max-w-none -translate-x-1/2 overflow-x-hidden bg-[#f7f1e3] pb-24 text-[#071d34] md:pb-0">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 opacity-40"
				style={{
					backgroundImage:
						"radial-gradient(circle at 18% 8%, rgba(184,33,57,.08), transparent 26%), radial-gradient(circle at 82% 42%, rgba(15,45,77,.08), transparent 30%), linear-gradient(90deg, rgba(7,29,52,.03) 1px, transparent 1px), linear-gradient(rgba(7,29,52,.025) 1px, transparent 1px)",
					backgroundSize: "auto, auto, 34px 34px, 34px 34px",
				}}
			/>

			<header className="relative border-[#071d34] border-b bg-[#fbf6ea]/95">
				<div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-8">
					<a className="flex min-h-11 items-center gap-3 font-serif font-bold" href="/dashboard">
						<span className="grid size-9 place-items-center border border-[#d9ccb5] bg-[#eef0ec] text-[#bf1737]">
							<PenTool aria-hidden="true" size={17} />
						</span>
						<span className="hidden sm:inline">Tiancheng Xu Portfolio</span>
						<span className="sm:hidden">PORTFOLIO</span>
					</a>
					<nav aria-label="项目导航" className="hidden items-center gap-2 md:flex">
						{links.map((link) => (
							<a
								aria-current={current === link.id ? "page" : undefined}
								className={`inline-flex min-h-11 items-center border px-4 font-bold text-xs tracking-[0.12em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#bf1737] ${
									current === link.id
										? "border-[#bf1737] bg-[#bf1737] text-white shadow-[3px_3px_0_#071d34]"
										: "border-[#c8bda9] bg-[#fbf6ea] text-[#344252] hover:border-[#bf1737] hover:bg-[#f3e7d7] hover:text-[#9f102a]"
								}`}
								href={link.href}
								key={link.id}
							>
								{link.label}
							</a>
						))}
					</nav>
				</div>
			</header>

			<main className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 md:py-12">
				<header className="border-[#d8cfbd] border-b pb-6">
					<p className="font-bold text-[#bf1737] text-xs uppercase tracking-[0.18em]">{eyebrow}</p>
					<h1 className="mt-3 font-serif font-bold text-3xl leading-tight md:text-5xl">{title}</h1>
					<p className="mt-4 max-w-3xl border-l-4 border-[#bf1737] bg-[#fbf8ef]/85 px-4 py-3 text-[#344252] text-sm leading-relaxed md:text-base">
						{description}
					</p>
				</header>
				<div className="mt-7">{children}</div>
			</main>

			<footer className="relative border-[#c8c0b0] border-t bg-[#ebe6da]">
				<div className="mx-auto flex min-h-24 w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-7 text-center sm:px-8 md:flex-row md:text-left">
					<div className="flex items-center gap-3 font-bold text-sm">
						<PenTool aria-hidden="true" className="text-[#bf1737]" size={18} />
						<span>TIANCHENG XU · PROJECT DELIVERY</span>
					</div>
					<div className="flex flex-wrap justify-center gap-2">
						<a className="inline-flex min-h-11 items-center border border-[#c8bda9] bg-[#fbf6ea] px-4 font-bold text-xs" href="/dashboard">返回作品集</a>
						<a className="inline-flex min-h-11 items-center bg-[#bf1737] px-4 font-bold text-white text-xs" href={current === "evidence" ? projectHomeUrl : evidenceUrl}>
							{current === "evidence" ? "返回项目主页" : "查看完整工作证明"}
						</a>
					</div>
				</div>
			</footer>

			<nav aria-label="项目快捷导航" className="fixed inset-x-0 bottom-0 z-50 border-[#d8cfbd] border-t bg-[#f7f1e3]/96 px-3 py-2 backdrop-blur md:hidden">
				<div className="mx-auto grid max-w-md grid-cols-3 gap-1.5">
					{links.map(({ href, icon: Icon, id, label }) => (
						<a
							aria-current={current === id ? "page" : undefined}
							className={`flex min-h-14 flex-col items-center justify-center gap-1 border px-1 font-bold text-[11px] ${
								current === id
									? "border-[#bf1737] bg-[#bf1737] text-white shadow-[2px_2px_0_#071d34]"
									: "border-[#d8cfbd] bg-[#fbf6ea] text-[#4d5863]"
							}`}
							href={href}
							key={id}
						>
							<Icon aria-hidden="true" size={18} />
							<span>{label}</span>
						</a>
					))}
				</div>
			</nav>
		</div>
	);
}
