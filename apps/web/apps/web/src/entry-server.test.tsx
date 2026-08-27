import { describe, expect, it } from "vitest";
import { renderDashboardRoute } from "./entry-server";

describe("static-first Dashboard", () => {
	it("renders the Dashboard route as readable HTML", async () => {
		const result = await renderDashboardRoute("/dashboard");
		expect(result.markup).toContain("Showcase Dashboard");
		expect(result.markup).toContain("Portfolio Sync");
		expect(result.markup).toContain(
			"Personal AI Agent 模型训练与本地推理：工作证明",
		);
		expect(result.hydrationHtml).toContain("$_TSR");
		expect(result.hydrationHtml).not.toContain("\0");
		expect(result.hydrationHtml).toContain("\\u0000");
	});

	it("renders the performance control deep link with its real project content", async () => {
		const result = await renderDashboardRoute("/performance-control/babysteps");
		expect(result.markup).toContain("性能观测成本控制");
		expect(result.markup).toContain("安全启动");
		expect(result.hydrationHtml).toContain("$_TSR");
	});

	it("renders each application deep link with application-specific semantics", async () => {
		const result = await renderDashboardRoute(
			"/performance-control/agent-market",
		);
		expect(result.markup).toContain("Agent Market");
		expect(result.markup).toContain("观测接入尚未完成");
		expect(result.markup).not.toContain("启动性能观测");
		expect(result.hydrationHtml).toContain("$_TSR");
	});
});
