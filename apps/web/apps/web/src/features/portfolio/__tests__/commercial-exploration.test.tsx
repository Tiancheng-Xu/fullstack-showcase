import { cleanup, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { COMMERCIAL_PROJECTS, commercialEvidencePath, excludeCommercialProjects, getCommercialProject } from "@/data/commercial-exploration";
import { CommercialExplorationSection, CommercialProjectEvidence } from "../commercial-exploration-section";
import { DashboardContent } from "../dashboard-content";
import { EvidenceContent } from "../evidence-content";

afterEach(cleanup);

describe("commercial exploration publication", () => {
	it("renders exactly four business products once in their own Dashboard module", () => {
		const { container } = render(<DashboardContent />);
		const module = screen.getByRole("region", { name: "商业探索" });
		expect(module).toHaveStyle({ order: "4" });
		expect(module.querySelectorAll("[data-commercial-project]")).toHaveLength(4);
		for (const project of COMMERCIAL_PROJECTS) {
			expect(within(module).getAllByRole("heading", { name: project.title })).toHaveLength(1);
			const ordinaryTitles = Array.from(container.querySelectorAll(".portfolio-project-card h3")).map((heading) => heading.textContent);
			expect(ordinaryTitles).not.toContain(project.title);
		}
		expect(COMMERCIAL_PROJECTS).toHaveLength(4);
		expect(COMMERCIAL_PROJECTS.some(({ id }) => id === "fullstack-showcase")).toBe(false);
	});
	it("removes injected commercial records from the ordinary project selector while preserving ordinary identities", () => {
		const ordinary = { id: "existing-product", title: "Existing product" };
		const mixed = [ordinary, ...COMMERCIAL_PROJECTS.map(({ id, title }) => ({ id, title }))];
		expect(excludeCommercialProjects(mixed)).toEqual([ordinary]);
		expect(excludeCommercialProjects(mixed)[0]).toBe(ordinary);
		expect(mixed).toHaveLength(5);
	});
	it("publishes only the verified Orderguard entry, without invented completion percentages or public positioning terms", () => {
		const { container } = render(<CommercialExplorationSection />);
		const products = screen.getAllByRole("link", { name: /产品入口/ });
		expect(products).toHaveLength(1);
		expect(products[0]).toHaveAttribute("href", "https://orderguard.baby2b.online/");
		expect(container.textContent).not.toMatch(/demo|learning|课堂|练习|\d+\s*%/i);
		expect(container).toHaveTextContent("固定合成资料只读交期核对；客户上传关闭");
		for (const project of COMMERCIAL_PROJECTS) expect(container.querySelector(`a[href="${commercialEvidencePath(project)}"]`)).not.toBeNull();
	});
	it.each(COMMERCIAL_PROJECTS)("renders truthful reciprocal Evidence for $id", (project) => {
		const { container } = render(<EvidenceContent projectId={project.id} />);
		expect(screen.getByRole("heading", { name: project.title, level: 1 })).toBeVisible();
		expect(screen.getByRole("link", { name: "作品集首页" })).toHaveAttribute("href", "/dashboard#commercial-exploration");
		expect(container).toHaveTextContent(project.verification);
		expect(container).toHaveTextContent(project.failureBoundary);
		expect(container.textContent).not.toMatch(/demo|learning|课堂|练习/i);
		expect(container.querySelector('a[href="https://github.com/Tiancheng-Xu#商业探索"]')).not.toBeNull();
		if (project.productUrl) expect(screen.getByRole("link", { name: "项目主页" })).toHaveAttribute("href", project.productUrl);
		else expect(screen.queryByRole("link", { name: "项目主页" })).not.toBeInTheDocument();
		expect(renderToString(<CommercialProjectEvidence project={project} />)).toContain('id="business-evidence"');
	});
	it("does not accept unknown or prototype-like project identifiers", () => {
		for (const id of ["__proto__", "constructor", "unknown-commercial-project"]) expect(getCommercialProject(id)).toBeUndefined();
	});
});
