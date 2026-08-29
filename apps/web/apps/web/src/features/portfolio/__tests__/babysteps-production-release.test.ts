import { describe, expect, it } from "vitest";

import { PORTFOLIO_PROJECTS } from "@/data/portfolio-projects";

describe("BabySteps production release evidence", () => {
	it("binds the performance layout release without rewriting the AWS runtime evidence", () => {
		const babySteps = PORTFOLIO_PROJECTS.find(
			(project) => project.id === "babysteps",
		);

		expect(babySteps?.skills).toEqual(
			expect.arrayContaining(["BackstopJS", "Core Web Vitals"]),
		);
		expect(babySteps?.evidence.join(" ")).toContain("798f557");
		expect(babySteps?.evidence.join(" ")).toContain("33229705200");
		expect(babySteps?.evidence.join(" ")).toContain("24c7af9c");
		expect(babySteps?.details.join(" ")).toContain(
			"没有启动 AWS Runtime",
		);
		expect(babySteps?.details.join(" ")).toContain("33160455921");
	});
});
