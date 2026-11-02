import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardContent } from "../dashboard-content";

describe("Dashboard project links", () => {
	it("links every resume project title to a matching entry and exposes Qwen", () => {
		const { container } = render(<DashboardContent />);
		const skills = container.querySelector("#skills") as HTMLElement;
		const titles = skills.querySelectorAll("h4");
		expect(titles.length).toBeGreaterThan(10);
		for (const title of titles) {
			const anchor = title.querySelector("a");
			expect(anchor).not.toBeNull();
			const href = anchor?.getAttribute("href") ?? "";
			expect(href).toMatch(/^(https:\/\/|\/|#project-)/);
			if (href.startsWith("#")) expect(container.querySelector(href)).not.toBeNull();
		}
		const resume = within(skills);
		expect(resume.getByRole("link", { name: "Qwen 云端工坊", exact: true })).toHaveAttribute("href", "https://qwen.baby2b.online/");
		expect(within(container.querySelector("#projects") as HTMLElement).getByRole("link", { name: /：Qwen 云端工坊/ })).toHaveAttribute("href", "https://qwen.baby2b.online/");
	});

	it("uses the existing project tags as real page links without dashboard fallbacks", () => {
		const { container } = render(<DashboardContent />);
		const projects = container.querySelector("#projects");
		expect(projects).not.toBeNull();
		const projectList = within(projects as HTMLElement);

		expect(
			projectList.getByRole("link", {
				name: "Personal AI Agent 模型训练与本地推理：项目主页",
			}),
		).toHaveAttribute("href", "https://personal-ai-agent.baby2b.online/");
		expect(
			projectList.getByRole("link", {
				name: "Personal AI Agent 模型训练与本地推理：工作证明",
			}),
		).toHaveAttribute(
			"href",
			"https://personal-ai-agent.baby2b.online/evidence/",
		);
		expect(
			projectList.getByRole("link", {
				name: "性能观测与成本控制：控制面",
			}),
		).toHaveAttribute(
			"href",
			"/performance-control/babysteps",
		);
		expect(
			projectList.getByRole("link", {
				name: "性能观测与成本控制：工作证明",
			}),
		).toHaveAttribute(
			"href",
			"https://baby2b.online/evidence/performance-observability-control",
		);

		expect(projects?.querySelectorAll('a[href="/dashboard"]')).toHaveLength(0);
	});
});
