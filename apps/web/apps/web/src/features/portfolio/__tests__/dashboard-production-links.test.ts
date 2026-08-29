import { describe, expect, it } from "vitest";

import { PORTFOLIO_PROJECTS } from "@/data/portfolio-projects";
import { PORTFOLIO_FRAME_CLASS } from "@/features/portfolio/portfolio-layout";

describe("portfolio production contracts", () => {
	it("keeps static-first links identical before and after remote hydration", () => {
		const agentMarket = PORTFOLIO_PROJECTS.find((project) => project.id === "agent-market");
		const babySteps = PORTFOLIO_PROJECTS.find(
			(project) => project.id === "babysteps",
		);
		const showcase = PORTFOLIO_PROJECTS.find(
			(project) => project.id === "fullstack-showcase",
		);
		expect(agentMarket?.ownerPage).toBe("https://agent-market.baby2b.online/");
		expect(agentMarket?.evidenceUrl).toBe("https://agent-market.baby2b.online/evidence/");
		expect(agentMarket?.status).toBe("已完成");
		expect(agentMarket?.progress).toBe(100);
		expect(agentMarket?.skills).toEqual(
			expect.arrayContaining(["AI Agents", "LangGraph", "Sepolia", "TC Flow"]),
		);
		expect(agentMarket?.evidence.join(" ")).toContain("24 笔 Sepolia V3");
		expect(agentMarket?.evidence.join(" ")).toContain("AWS V2");
		expect(agentMarket?.evidence.join(" ")).toContain("verified-production");
		expect(agentMarket?.evidence.join(" ")).toContain("零 ECS Task");
		expect(agentMarket?.evidence.join(" ")).toContain("58cec1090a62");
		expect(agentMarket?.evidence.join(" ")).toContain("33232010589");
		expect(agentMarket?.details.join(" ")).toContain("f0172a7e");
		expect(agentMarket?.details.join(" ")).toContain("2026-08-27 closure JSON");
		expect(agentMarket?.details.join(" ")).toContain("不能互相替代");
		expect(agentMarket?.details.join(" ")).toContain("不作为实时市场成交或 AWS Runtime 证据");
		expect(agentMarket?.sourceUpdatedAt).toBe("2026-08-29");
		expect(agentMarket?.renderingModes).not.toContain("Cloud Preview Pending");
		expect(babySteps?.title).toBe("BabySteps");
		expect(babySteps?.skills).toContain("Static-First Delivery");
		expect(babySteps?.evidenceUrl).toBe("https://babysteps.baby2b.online/evidence/");
		expect(showcase?.evidenceUrl).toBe(
			"https://baby2b.online/evidence/fullstack-showcase",
		);
	});

	it("uses the shared ultrawide frame", () => {
		expect(PORTFOLIO_FRAME_CLASS).toContain("max-w-[110rem]");
	});
});
