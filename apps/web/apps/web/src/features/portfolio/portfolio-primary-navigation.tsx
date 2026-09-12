import { Link, useRouter } from "@tanstack/react-router";

export type PortfolioPrimaryRoute = "dashboard" | "projects" | "evidence" | "open-source";

const ITEMS: ReadonlyArray<{
	id: PortfolioPrimaryRoute;
	href: "/dashboard" | "/projects" | "/evidence" | "/open-source";
	label: string;
}> = [
	{ id: "dashboard", href: "/dashboard", label: "首页" },
	{ id: "projects", href: "/projects", label: "项目" },
	{ id: "open-source", href: "/open-source", label: "开源共建" },
];

export function PortfolioPrimaryNavigation({
	current,
}: {
	current: PortfolioPrimaryRoute;
}) {
	const router = useRouter({ warn: false });
	return (
		<nav aria-label="作品集主导航" className="portfolio-primary-navigation">
			<span
				aria-hidden="true"
				className="portfolio-primary-navigation-mark"
			>
				<svg fill="none" viewBox="0 0 24 24">
					<path d="M3 10h18M5 10 12 4l7 6M6 10v8m4-8v8m4-8v8m4-8v8M4 18h16M2.5 21h19" />
				</svg>
			</span>
			{ITEMS.map((item) => {
				const props = {
					"aria-current": current === item.id ? ("page" as const) : undefined,
					className: current === item.id ? "is-active" : undefined,
				};
				return router ? (
					<Link {...props} key={item.id} to={item.href}>
						{item.label}
					</Link>
				) : (
					<a {...props} href={item.href} key={item.id}>
						{item.label}
					</a>
				);
			})}
		</nav>
	);
}
