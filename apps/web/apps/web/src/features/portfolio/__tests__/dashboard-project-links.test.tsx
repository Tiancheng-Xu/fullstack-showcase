import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardContent } from "../dashboard-content";

describe("Dashboard project links", () => {
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
			"https://evidence.baby2b.online/personal-ai-agent/",
		);
		expect(
			projectList.getByRole("link", {
				name: "性能观测与成本控制：控制面",
			}),
		).toHaveAttribute(
			"href",
			"/performance-control?project=performance-observability-control",
		);
		expect(
			projectList.getByRole("link", {
				name: "性能观测与成本控制：工作证明",
			}),
		).toHaveAttribute("href", "/evidence/performance-observability-control");

		expect(projects?.querySelectorAll('a[href="/dashboard"]')).toHaveLength(0);
	});
});
