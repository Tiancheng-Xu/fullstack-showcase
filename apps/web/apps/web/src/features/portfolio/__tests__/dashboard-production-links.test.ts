import { describe, expect, it } from "vitest";

import { PORTFOLIO_PROJECTS } from "@/data/portfolio-projects";
import { PORTFOLIO_FRAME_CLASS } from "@/features/portfolio/portfolio-layout";

describe("portfolio production contracts", () => {
	it("keeps static-first links identical before and after remote hydration", () => {
		const agentMarket = PORTFOLIO_PROJECTS.find((project) => project.id === "agent-market");
		const babySteps = PORTFOLIO_PROJECTS.find(
			(project) => project.id === "babysteps",
		);
		expect(agentMarket?.ownerPage).toBe("https://agent-market.baby2b.online/");
		expect(agentMarket?.evidenceUrl).toBe("https://evidence.baby2b.online/agent-market/");
		expect(babySteps?.title).toBe("BabySteps");
		expect(babySteps?.skills).toContain("Static-First Delivery");
		expect(babySteps?.evidenceUrl).toBe("https://evidence.baby2b.online/babysteps/");
	});

	it("uses the shared ultrawide frame", () => {
		expect(PORTFOLIO_FRAME_CLASS).toContain("max-w-[110rem]");
	});
});
