import {
	getProjectPageLinks,
	type PortfolioProject,
	type ProjectPageLink,
} from "@/data/portfolio-projects";

const PORTFOLIO_ORIGIN = "https://baby2b.online";

export type ProjectActionLink = {
	id: ProjectPageLink["id"] | "repository";
	label: string;
	href: string;
};

export function normalizePortfolioHref(href: string): string {
	try {
		const url = new URL(href, PORTFOLIO_ORIGIN);
		url.pathname = url.pathname.replace(/\/+$/, "") || "/";
		return url.href;
	} catch {
		return href;
	}
}

export function isSamePortfolioDocument(left: string, right: string): boolean {
	return normalizePortfolioHref(left).split("#")[0] === normalizePortfolioHref(right).split("#")[0];
}

export function getProjectActionLinks(
	project: PortfolioProject,
	includeRepository = false,
): ProjectActionLink[] {
	const links: ProjectActionLink[] = getProjectPageLinks(project).map((link) => ({
		...link,
		label: link.id === "project" && /^https:\/\/github\.com\//i.test(link.href)
			? includeRepository && project.repo &&
				normalizePortfolioHref(link.href) !== normalizePortfolioHref(`https://github.com/${project.repo}`)
				? "GitHub 主页"
				: "GitHub"
			: link.label,
	}));
	if (includeRepository && project.repo) {
		links.push({ id: "repository", label: "GitHub", href: `https://github.com/${project.repo}` });
	}
	const priority = { project: 0, control: 1, evidence: 2, repository: 3 };
	const seen = new Set<string>();
	return links.sort((a, b) => priority[a.id] - priority[b.id]).filter((link) => {
		const target = normalizePortfolioHref(link.href);
		if (seen.has(target)) return false;
		seen.add(target);
		return true;
	});
}
