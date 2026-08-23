import { describe, expect, it } from "vitest";

import type { PortfolioProject } from "./portfolio-projects";
import { mergePortfolioProjects } from "./portfolio-sync";

const project: PortfolioProject = {
	id: "example",
	title: "Example",
	desc: "Example project",
	status: "已完成",
	progress: 100,
	architecture: "Browser to API",
	evidenceUrl: "https://evidence.example.com/",
	ownerPage: "https://project.example.com/",
	repo: "Tiancheng-Xu/example",
	skills: [],
	evidence: [],
	details: [],
};

describe("mergePortfolioProjects", () => {
	it("does not erase curated page links when sync fields are empty", () => {
		const remote = {
			...project,
			evidenceUrl: "",
			ownerPage: "",
			progress: 90,
			status: "进行中" as const,
		};

		expect(mergePortfolioProjects([project], [remote])).toEqual([
			expect.objectContaining({
				evidenceUrl: project.evidenceUrl,
				ownerPage: project.ownerPage,
				progress: 90,
				status: "进行中",
			}),
		]);
	});

	it("keeps BabySteps as the project identity when merging its rendering evidence", () => {
		const local = {
			...project,
			id: "babysteps",
			title: "BabySteps",
			repo: "Tiancheng-Xu/babysteps",
			skills: ["Static-First Delivery", "Edge SSR"],
		};
		const remote = {
			...project,
			id: "babysteps",
			title: "Babysteps",
			repo: "Tiancheng-Xu/babysteps",
		};

		expect(mergePortfolioProjects([local], [remote])).toEqual([
			expect.objectContaining({
				id: "babysteps",
				title: "BabySteps",
				skills: ["Static-First Delivery", "Edge SSR"],
			}),
		]);
	});
});
