import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { getProjectPageLinks, PORTFOLIO_PROJECTS } from "@/data/portfolio-projects";
import { DashboardContent } from "../dashboard-content";
import { getProjectActionLinks, isSamePortfolioDocument, normalizePortfolioHref } from "../portfolio-action-links";
import { PortfolioPageShell } from "../portfolio-page-shell";
import { ProjectIndexContent } from "../project-index-content";
import { SharingArticleDirectory } from "../sharing-article-directory";

afterEach(() => {
	cleanup();
	window.history.replaceState(null, "", "/");
});

describe("project action deduplication", () => {
	it("normalizes absolute/relative paths and trailing slashes but preserves queries and anchors", () => {
		expect(normalizePortfolioHref("/evidence/example/")).toBe(normalizePortfolioHref("https://baby2b.online/evidence/example"));
		expect(normalizePortfolioHref("/evidence/example#prd-design")).not.toBe(normalizePortfolioHref("/evidence/example#evidence"));
		expect(normalizePortfolioHref("/sharing?topic=v8")).not.toBe(normalizePortfolioHref("/sharing?topic=conference"));
	});
	it("keeps unique destinations for every curated project, including repository fallback", () => {
		for (const project of PORTFOLIO_PROJECTS) {
			const links = getProjectActionLinks(project, true);
			const originalTargets = getProjectPageLinks(project).map((link) => link.href);
			if (project.repo) originalTargets.push(`https://github.com/${project.repo}`);
			expect(new Set(links.map((link) => normalizePortfolioHref(link.href)))).toEqual(new Set(originalTargets.map(normalizePortfolioHref)));
			expect(new Set(links.map((link) => normalizePortfolioHref(link.href))).size).toBe(links.length);
			if (project.ownerPage?.startsWith("https://github.com/")) {
				expect(links.find((link) => link.id === "project")?.label).toBe("GitHub");
			}
		}
	});
	it("renders one destination per Dashboard project card and labels the primary action honestly", () => {
		const { container } = render(<DashboardContent />);
		const cards = container.querySelectorAll(".portfolio-project-card");
		expect(cards.length).toBeGreaterThan(0);
		for (const card of cards) {
			const hrefs = Array.from(card.querySelectorAll<HTMLAnchorElement>("a[href]")).map((link) => normalizePortfolioHref(link.getAttribute("href") ?? ""));
			expect(new Set(hrefs).size).toBe(hrefs.length);
			const project = PORTFOLIO_PROJECTS.find((item) => item.title === card.querySelector("h3")?.textContent);
			expect(project).toBeDefined();
			if (!project) throw new Error("Rendered project has no curated source");
			const originalTargets = new Set(getProjectPageLinks(project).map((link) => normalizePortfolioHref(link.href)));
			expect(new Set(hrefs)).toEqual(originalTargets);
			const primary = card.querySelector(".portfolio-project-action");
			if (originalTargets.size === 0) expect(primary).toBeNull();
			else {
				expect(primary).not.toBeNull();
				expect(primary?.textContent ?? "").not.toContain("查看工作证明");
			}
		}
		expect(within(container.querySelector("#projects") as HTMLElement).getByRole("link", { name: "Personal AI Agent 模型训练与本地推理：项目主页" })).toHaveAttribute("href", "https://personal-ai-agent.baby2b.online/");
	});
	it("renders the project index without dropping any homepage, evidence, control or repository destination", () => {
		const { container } = render(<ProjectIndexContent />);
		const cards = container.querySelectorAll(".portfolio-index-card");
		expect(cards.length).toBeGreaterThan(0);
		for (const card of cards) {
			const project = PORTFOLIO_PROJECTS.find((item) => item.title === card.querySelector("h3")?.textContent);
			if (!project) throw new Error("Rendered project has no curated source");
			const expected = getProjectPageLinks(project).map((link) => normalizePortfolioHref(link.href));
			if (project.repo) expected.push(normalizePortfolioHref(`https://github.com/${project.repo}`));
			const actual = Array.from(card.querySelectorAll<HTMLAnchorElement>("nav a[href]")).map((link) => normalizePortfolioHref(link.getAttribute("href") ?? ""));
			expect(new Set(actual)).toEqual(new Set(expected));
			expect(new Set(actual).size).toBe(actual.length);
		}
	});
	it("merges identical GitHub destinations but retains distinct queries and section anchors", () => {
		const fixture = { ...PORTFOLIO_PROJECTS[0], performance: undefined, repo: "example/project", ownerPage: "https://github.com/example/project/", evidenceUrl: "/evidence/example" };
		expect(getProjectActionLinks(fixture, true).map((link) => link.label)).toEqual(["GitHub", "工作证明"]);
		for (const [home, evidence] of [["/evidence/example#prd-design", "/evidence/example#evidence"], ["/sharing?topic=v8", "/sharing?topic=conference"]]) {
			expect(getProjectActionLinks({ ...fixture, repo: undefined, ownerPage: home, evidenceUrl: evidence }, true)).toHaveLength(2);
		}
	});
	it("distinguishes documents from section anchors for footer navigation", () => {
		expect(isSamePortfolioDocument("/evidence/example", "https://baby2b.online/evidence/example/#evidence")).toBe(true);
		expect(isSamePortfolioDocument("https://example.baby2b.online/", "https://example.baby2b.online/evidence/")).toBe(false);
	});
	it("returns to the evidence index when the proposed project homepage is this same document", () => {
		const { container } = render(<PortfolioPageShell current="evidence" description="Example" evidenceUrl="https://baby2b.online/evidence/example#evidence" eyebrow="Evidence" projectHomeUrl="/evidence/example/" title="Example"><p>Body</p></PortfolioPageShell>);
		const footer = container.querySelector("footer") as HTMLElement;
		expect(within(footer).getByRole("link", { name: "返回工作证明索引" })).toHaveAttribute("href", "/evidence");
		expect(within(footer).queryByRole("link", { name: "返回项目主页" })).toBeNull();
	});
});

describe("topic-specific sharing entry", () => {
	it.each(["v8", "conference", "overreacted"])("selects the requested %s topic after mounting", (topic) => {
		window.history.replaceState(null, "", `/sharing?topic=${topic}#sharing-articles`);
		const { container } = render(<SharingArticleDirectory />);
		expect(container.querySelectorAll(".sharing-directory-group")).toHaveLength(1);
		expect(container.querySelector(`#directory-${topic}`)).not.toBeNull();
	});
	it("hydrates a query-specific URL from the all-topics server document without recovery errors", async () => {
		window.history.replaceState(null, "", "/sharing?topic=v8#sharing-articles");
		const host = document.createElement("div");
		host.innerHTML = renderToString(<SharingArticleDirectory />);
		expect(host.querySelectorAll(".sharing-directory-group")).toHaveLength(3);
		document.body.append(host);
		const errors: unknown[] = [];
		let root: ReturnType<typeof hydrateRoot> | undefined;
		try {
			await act(async () => {
				root = hydrateRoot(host, <SharingArticleDirectory />, { onRecoverableError: (error) => errors.push(error) });
			});
			expect(errors).toEqual([]);
			expect(host.querySelectorAll(".sharing-directory-group")).toHaveLength(1);
			expect(host.querySelector("#directory-v8")).not.toBeNull();
		} finally {
			await act(async () => root?.unmount());
			host.remove();
		}
	});
	it("restores topic state on popstate and replaces filter selections without adding history entries", () => {
		window.history.replaceState({ marker: "preserved" }, "", "/sharing?topic=v8#sharing-articles");
		const { container } = render(<SharingArticleDirectory />);
		const historyLength = window.history.length;
		fireEvent.click(within(container).getByRole("button", { name: /^AI 会议/ }));
		expect(window.history.length).toBe(historyLength);
		expect(window.history.state).toEqual({ marker: "preserved" });
		window.history.replaceState(window.history.state, "", "/sharing?topic=overreacted#sharing-articles");
		fireEvent.popState(window);
		expect(container.querySelector("#directory-overreacted")).not.toBeNull();
		expect(container.querySelector("#directory-conference")).toBeNull();
		window.history.replaceState(window.history.state, "", "/sharing?topic=v8#sharing-articles");
		fireEvent.popState(window);
		expect(container.querySelector("#directory-v8")).not.toBeNull();
	});
	it("ignores unknown topics and clears the URL filter when all is selected", () => {
		window.history.replaceState(null, "", "/sharing?topic=unknown#sharing-articles");
		const { container } = render(<SharingArticleDirectory />);
		expect(container.querySelectorAll(".sharing-directory-group")).toHaveLength(3);
		fireEvent.click(within(container).getByRole("button", { name: /^V8/ }));
		expect(new URLSearchParams(window.location.search).get("topic")).toBe("v8");
		fireEvent.click(within(container).getByRole("button", { name: /^全部/ }));
		expect(new URLSearchParams(window.location.search).has("topic")).toBe(false);
		expect(window.location.hash).toBe("#sharing-articles");
	});
});
