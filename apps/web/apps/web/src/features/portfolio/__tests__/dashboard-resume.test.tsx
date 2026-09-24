import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardContent } from "../dashboard-content";

describe("Dashboard resume", () => {
	it("lists the primary project experience instead of a partial sample", () => {
		render(<DashboardContent />);

		const resumeHeading = screen.getByRole("heading", { name: "个人简历" });
		const resumeSection = resumeHeading.closest("section");
		expect(resumeSection).not.toBeNull();

		const resume = within(resumeSection as HTMLElement);
		const resumePanel = resumeSection?.querySelector(".portfolio-dashboard-module-card");
		const introduction = resumePanel?.querySelector(":scope > p");
		const capabilities = resumePanel?.querySelector(".resume-core-capabilities");
		expect(introduction).not.toBeNull();
		expect(capabilities).not.toBeNull();
		expect(introduction).not.toHaveClass("max-w-5xl");
		expect(capabilities).not.toHaveClass("max-w-5xl");
		for (const project of [
			"BabySteps",
			"Agent Market",
			"Personal AI Agent",
			"Showcase Dashboard",
			"GitHub Profile Studio",
			"Portfolio Sync",
			"性能观测与成本控制",
			"TC Flow 2.1",
		]) {
			expect(resume.getByRole("heading", { name: project })).toBeVisible();
		}
		expect(resume.getByText("拥有 8 年软件开发经验", { exact: false })).toBeVisible();
		expect(resume.getByText("全栈工程师（AI Agent / Web3）")).toBeVisible();
		expect(resume.queryByText("前端 / 全栈工程师（AI Agent / Web3）")).not.toBeInTheDocument();
		expect(resume.getByText(/Jev \+ Laya 双影子扩展目前是本地未发布代码/)).toBeVisible();
	});
});
