import { Link, useRouter } from "@tanstack/react-router";

export type PortfolioPrimaryRoute = "dashboard" | "projects" | "evidence";

const ITEMS: ReadonlyArray<{
	id: PortfolioPrimaryRoute;
	href: "/dashboard" | "/projects" | "/evidence";
	label: string;
}> = [
	{ id: "dashboard", href: "/dashboard", label: "作品集首页" },
	{ id: "projects", href: "/projects", label: "项目" },
	{ id: "evidence", href: "/evidence", label: "工作证明" },
];

export function PortfolioPrimaryNavigation({
	current,
}: {
	current: PortfolioPrimaryRoute;
}) {
	const router = useRouter({ warn: false });
	return (
		<nav aria-label="作品集主导航" className="portfolio-primary-navigation">
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
