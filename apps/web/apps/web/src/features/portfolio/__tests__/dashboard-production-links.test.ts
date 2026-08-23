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
