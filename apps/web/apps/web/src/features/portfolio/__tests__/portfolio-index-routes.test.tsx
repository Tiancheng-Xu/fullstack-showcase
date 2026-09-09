import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PORTFOLIO_PROJECTS } from "@/data/portfolio-projects";
import { EvidenceIndexContent } from "@/features/portfolio/evidence-index-content";
import { ProjectIndexContent } from "@/features/portfolio/project-index-content";

describe("portfolio index routes", () => {
	beforeEach(() => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
	});

	afterEach(() => vi.unstubAllGlobals());

	it("renders every project from the shared static index", () => {
		render(<ProjectIndexContent />);
		expect(
			screen.getByRole("heading", { name: "项目索引" }),
		).toBeInTheDocument();
		for (const project of PORTFOLIO_PROJECTS) {
			expect(
				screen.getByRole("heading", { name: project.title }),
			).toBeInTheDocument();
		}
	});

	it("renders reviewed non-executable Archify diagrams for systems and skips Skill projects", () => {
		render(<EvidenceIndexContent />);
		const systemProjects = PORTFOLIO_PROJECTS.filter(
			(project) => project.architectureAsset,
		);
		expect(screen.getAllByAltText(/Archify 架构图$/)).toHaveLength(
			systemProjects.length,
		);
		expect(screen.queryAllByTitle(/Archify 架构图$/)).toHaveLength(0);
		expect(screen.getByText("Skill / 工作流项目")).toBeInTheDocument();
		for (const viewport of screen.getAllByLabelText(
			/可横向滚动查看完整架构图$/,
		)) {
			expect(viewport).toHaveAttribute("tabindex", "0");
		}
		const fullDiagramLinks = screen.getAllByRole("link", {
			name: /打开完整架构图$/,
		});
		expect(fullDiagramLinks).toHaveLength(systemProjects.length);
		for (const link of fullDiagramLinks) {
			expect(link).toHaveAttribute(
				"href",
				expect.stringMatching(/\.visual-check\.1440x900\.light\.png$/),
			);
		}
	});

	it("ships validated Archify source and reviewed image for every system project", () => {
		for (const project of PORTFOLIO_PROJECTS.filter(
			(project) => project.architectureAsset,
		)) {
			const root = resolve(process.cwd(), "public/architecture");
			const architectureAsset = project.architectureAsset;
			if (!architectureAsset) {
				throw new Error(`${project.id} has no architecture asset`);
			}
			expect(existsSync(resolve(root, `${project.id}.architecture.json`))).toBe(
				true,
			);
			expect(
				existsSync(resolve(process.cwd(), "public", architectureAsset)),
			).toBe(true);
			expect(architectureAsset).toMatch(
				/\.visual-check\.1440x900\.light\.png$/,
			);
			const report = readFileSync(
				resolve(root, `${project.id}.visual-check.json`),
				"utf8",
			);
			expect(report).not.toContain("/Users/");
		}
		expect(
			existsSync(
				resolve(process.cwd(), "public/architecture/tc-workflow.html"),
			),
		).toBe(false);
		const architectureRoot = resolve(process.cwd(), "public/architecture");
		for (const file of readdirSync(architectureRoot).filter((name) =>
			/\.(?:html|json)$/u.test(name),
		)) {
			const publicArtifact = readFileSync(
				resolve(architectureRoot, file),
				"utf8",
			);
			expect(publicArtifact).not.toMatch(
				/\/Users\/|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|gh[pousr]_[A-Za-z0-9_]+|x-control-totp|@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/u,
			);
			expect(publicArtifact).not.toContain("fonts.googleapis.com");
			expect(publicArtifact).not.toContain("fonts.gstatic.com");
		}
	});
});
