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
				progress: project.progress,
				status: project.status,
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

	it("keeps curated project-owned links when the remote index is stale", () => {
		const remote = {
			...project,
			evidenceUrl: "https://evidence.baby2b.online/example/",
			ownerPage: "https://old-preview.pages.dev/",
		};

		expect(mergePortfolioProjects([project], [remote])).toEqual([
			expect.objectContaining({
				evidenceUrl: project.evidenceUrl,
				ownerPage: project.ownerPage,
			}),
		]);
	});

	it("does not append the retired standalone Evidence Hub from a stale index", () => {
		const retired = {
			...project,
			id: "baby2b-online-deployment-evidence",
			title: "Baby2b Online Deployment Evidence",
			repo: "Tiancheng-Xu/baby2b-online-deployment-evidence",
			evidenceUrl: "https://evidence.baby2b.online/",
			ownerPage: "https://evidence.baby2b.online/",
		};

		expect(mergePortfolioProjects([project], [retired])).toEqual([project]);
	});

	it("does not let sync rewrite curated facts or verification fields", () => {
		const local = {
			...project,
			title: "Curated title",
			desc: "Old description",
			architectureAsset: "architecture/example.html",
		};
		const remote = {
			...project,
			title: "Curated title",
			desc: "Fresh description",
			architecture: "Unreviewed architecture",
			evidence: ["Unreviewed production claim"],
			details: ["Unreviewed delivery claim"],
			status: "已完成" as const,
			progress: 100,
			architectureAsset: "https://untrusted.example/diagram.html",
		};

		expect(mergePortfolioProjects([local], [remote])).toEqual([
			expect.objectContaining({
				title: "Curated title",
				desc: local.desc,
				architecture: local.architecture,
				evidence: local.evidence,
				details: local.details,
				status: local.status,
				progress: local.progress,
				architectureAsset: local.architectureAsset,
			}),
		]);
	});

	it("does not append an unreviewed project from the remote index", () => {
		const remote = {
			...project,
			id: "remote-only",
			architectureAsset: "https://untrusted.example/diagram.html",
		};

		expect(mergePortfolioProjects([], [remote])).toEqual([]);
	});
});
