import { describe, expect, it } from "vitest";

import { PORTFOLIO_PROJECTS } from "@/data/portfolio-projects";

describe("BabySteps production release evidence", () => {
	it("binds the recovery Evidence release without rewriting the AWS runtime snapshot", () => {
		const babySteps = PORTFOLIO_PROJECTS.find(
			(project) => project.id === "babysteps",
		);
		const performanceControl = PORTFOLIO_PROJECTS.find(
			(project) => project.id === "performance-observability-control",
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
		expect(babySteps?.evidence.join(" ")).toContain("121ebc47");
		expect(babySteps?.evidence.join(" ")).toContain("33245253835");
		expect(babySteps?.evidence.join(" ")).toContain("11e51b2f");
		expect(babySteps?.evidence.join(" ")).toContain("33244161458");
		expect(babySteps?.details.join(" ")).toContain("返回 503");
		expect(babySteps?.details.join(" ")).toContain("不代表实时管线运行");
		expect(babySteps?.sourceUpdatedAt).toBe("2026-08-29");
		expect(performanceControl?.evidence.join(" ")).toContain("17 个启用 Region");
		expect(performanceControl?.details.join(" ")).toContain("未上传完整 Artifact");
		expect(performanceControl?.details.join(" ")).toContain("不能替换可信快照");
	});
});
