import { describe, expect, it } from "vitest";

import { PORTFOLIO_PROJECTS } from "@/data/portfolio-projects";
import { PORTFOLIO_FRAME_CLASS } from "@/features/portfolio/portfolio-layout";

describe("portfolio production contracts", () => {
	it("keeps static-first links identical before and after remote hydration", () => {
		const agentMarket = PORTFOLIO_PROJECTS.find(
			(project) => project.id === "agent-market",
		);
		const babySteps = PORTFOLIO_PROJECTS.find(
			(project) => project.id === "babysteps",
		);
		const showcase = PORTFOLIO_PROJECTS.find(
			(project) => project.id === "fullstack-showcase",
		);
		expect(agentMarket?.ownerPage).toBe("https://agent-market.baby2b.online/");
		expect(agentMarket?.evidenceUrl).toBe(
			"https://agent-market.baby2b.online/evidence/",
		);
		expect(agentMarket?.status).toBe("已完成");
		expect(agentMarket?.progress).toBe(100);
		expect(agentMarket?.skills).toEqual(
			expect.arrayContaining(["AI Agents", "LangGraph", "Sepolia", "TC Flow"]),
		);
		expect(agentMarket?.evidence.join(" ")).toContain("24 笔 Sepolia V3");
		expect(agentMarket?.evidence.join(" ")).toContain("AWS V2");
		expect(agentMarket?.evidence.join(" ")).toContain("verified-production");
		expect(agentMarket?.evidence.join(" ")).toContain("零 ECS Task");
    expect(agentMarket?.evidence.join(" ")).toContain("0c47139946c274d93db024b47c151aececb40376");
    expect(agentMarket?.evidence.join(" ")).toContain("34706347471");
		expect(agentMarket?.details.join(" ")).toContain("34705871834");
    expect(agentMarket?.details.join(" ")).toContain("d8cf5994-ce54-47f1-8979-0c799eca8b79");
    expect(agentMarket?.details.join(" ")).toContain("source 2dfe6d0aa6fa40b65762c07ed687921233b0e0c6");
    expect(agentMarket?.details.join(" ")).toContain("de287f0d-8e89-4eca-bb0c-b08a1fb5af8f");
    expect(agentMarket?.details.join(" ")).toContain("source a9278665d25dad64ab22477a10a39974a2712744");
    expect(agentMarket?.details.join(" ")).toContain("8c556e3b-c4de-4c43-a6d4-ce1c6582f074");
    expect(agentMarket?.details.join(" ")).toContain("source 0c47139946c274d93db024b47c151aececb40376");
    expect(agentMarket?.details.join(" ")).toContain("Range 请求返回 206");
		expect(agentMarket?.details.join(" ")).toContain("互不替代");
		expect(agentMarket?.details.join(" ")).toContain("未触发 AWS mutation");
		expect(agentMarket?.evidence.join(" ")).not.toContain("58cec1090a62");
		expect(agentMarket?.details.join(" ")).not.toContain("f0172a7e");
		expect(agentMarket?.evidence.join(" ")).not.toContain("305a89c4b0d6");
		expect(agentMarket?.evidence.join(" ")).not.toContain("33337714155");
		expect(agentMarket?.details.join(" ")).not.toContain("8d6c44a5");
		expect(agentMarket?.details.join(" ")).toContain(
			"不作为实时市场成交或 AWS Runtime 证据",
		);
		expect(agentMarket?.sourceUpdatedAt).toBe("2026-09-07");
		expect(agentMarket?.renderingModes).not.toContain("Cloud Preview Pending");
		expect(babySteps?.title).toBe("BabySteps");
		expect(babySteps?.skills).toContain("Static-First Delivery");
		expect(babySteps?.evidenceUrl).toBe(
			"https://babysteps.baby2b.online/evidence/",
		);
		expect(showcase?.evidenceUrl).toBe(
			"https://baby2b.online/evidence/fullstack-showcase",
		);
	});

	it("uses the shared ultrawide frame", () => {
		expect(PORTFOLIO_FRAME_CLASS).toContain("max-w-[110rem]");
	});
});
