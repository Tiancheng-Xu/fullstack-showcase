import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PORTFOLIO_PROJECTS } from "@/data/portfolio-projects";
import { ProjectArchitecturePreview } from "../project-architecture-preview";

describe("ProjectArchitecturePreview", () => {
	const architectureProjects = PORTFOLIO_PROJECTS.filter(
		(project) => project.architectureAsset,
	);

	it("keeps all eight Archify source, screenshot, and interactive assets aligned", () => {
		const publicDirectory = resolve(process.cwd(), "public");
		expect(architectureProjects).toHaveLength(8);
		for (const project of architectureProjects) {
			expect(
				existsSync(join(publicDirectory, project.architectureAsset ?? "")),
			).toBe(true);
			expect(
				existsSync(
					join(publicDirectory, "architecture", `${project.id}.architecture.json`),
				),
			).toBe(true);
			expect(
				existsSync(
					join(publicDirectory, "architecture", `${project.id}.interactive.html`),
				),
			).toBe(true);
		}
	});

	it("keeps the interactive Archify document deferred until requested", async () => {
		const user = userEvent.setup();
		const project = PORTFOLIO_PROJECTS.find((item) => item.id === "agent-market");
		expect(project).toBeDefined();
		if (!project) return;

		render(<ProjectArchitecturePreview project={project} />);

		const screenshot = screen.getByRole("img", {
			name: "Agent Market 架构图静态预览",
		});
		expect(screenshot).toHaveAttribute("loading", "lazy");
		expect(screenshot).toHaveAttribute(
			"src",
			"/architecture/agent-market.visual-check.1440x900.light.png",
		);
		expect(screen.queryByTitle("Agent Market Archify 动态架构图")).not.toBeInTheDocument();

		await user.click(
			screen.getByRole("button", { name: "查看 Agent Market 动态架构图" }),
		);

		const dialog = screen.getByRole("dialog");
		expect(dialog.tagName).toBe("DIALOG");
		expect(dialog).toHaveAttribute("open");
		const backgroundElements = Array.from(document.body.children).filter(
			(element) => element !== dialog,
		);
		expect(backgroundElements.length).toBeGreaterThan(0);
		expect(
			backgroundElements.every((element) => element.hasAttribute("inert")),
		).toBe(true);
		const iframe = screen.getByTitle("Agent Market Archify 动态架构图");
		expect(iframe).toHaveAttribute(
			"src",
			"/architecture/agent-market.interactive.html",
		);
		expect(iframe).toHaveAttribute("sandbox", "allow-downloads allow-scripts");
		expect(screen.getByRole("button", { name: "关闭动态架构图" })).toHaveFocus();

		await user.click(screen.getByRole("button", { name: "关闭动态架构图" }));
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		expect(
			backgroundElements.every((element) => !element.hasAttribute("inert")),
		).toBe(true);
		expect(
			screen.getByRole("button", { name: "查看 Agent Market 动态架构图" }),
		).toHaveFocus();
	});

	it("closes through Escape and backdrop without losing trigger focus", async () => {
		const user = userEvent.setup();
		const project = architectureProjects[0];
		render(<ProjectArchitecturePreview project={project} />);
		const trigger = screen.getByRole("button", {
			name: `查看 ${project.title} 动态架构图`,
		});

		await user.click(trigger);
		fireEvent(
			screen.getByRole("dialog"),
			new Event("cancel", { bubbles: false, cancelable: true }),
		);
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		expect(trigger).toHaveFocus();

		await user.click(trigger);
		fireEvent.mouseDown(screen.getByTestId("architecture-dialog-backdrop"));
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		expect(trigger).toHaveFocus();
	});

	it("renders nothing when a project has no architecture screenshot", () => {
		const project = PORTFOLIO_PROJECTS.find((item) => !item.architectureAsset);
		expect(project).toBeDefined();
		if (!project) return;

		const { container } = render(<ProjectArchitecturePreview project={project} />);
		expect(container).toBeEmptyDOMElement();
	});
});
