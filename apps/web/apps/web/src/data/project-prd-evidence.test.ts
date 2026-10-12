import { describe, expect, it } from "vitest";
import {
	getProjectPrdEvidence,
	PRD_EVIDENCE_COVERAGE,
	PROJECT_PRD_EVIDENCE,
	projectPrdSummaryUrl,
} from "./project-prd-evidence";

describe("reviewed project PRD Evidence registry", () => {
	it("covers each of the 21 project stories and both design modules once", () => {
		expect(PROJECT_PRD_EVIDENCE.map(({ id }) => id).sort()).toEqual(
			[
				"agent-market",
				"service-agent-workbench",
				"office-workflow-agent",
				"personal-ai-agent",
				"babysteps",
				"fullstack-showcase",
				"portfolio-sync",
				"github-profile-studio",
				"hono-github-profile",
				"aladdin",
				"ningbo-traffic-dashboard",
				"government-low-code-fde",
				"tc-workflow",
				"shared-evidence-verifier",
				"performance-observability-control",
				"wechat-intent-hud",
				"codex-translate",
				"knowledge-evidence-pipeline",
				"codex-mascot",
				"hatch-pet",
				"oss-contributions",
				"enterprise-document-parser",
				"agent-data-sandbox",
			].sort(),
		);
	});

	it("carries actual document identities without publishing private originals", () => {
		expect(PRD_EVIDENCE_COVERAGE.sources).toHaveLength(19);
		for (const source of PRD_EVIDENCE_COVERAGE.sources) {
			expect(source.sha256).toMatch(/^[a-f0-9]{64}$/);
			expect(source.name).toMatch(/(?:规格|去重说明) · /);
			expect(source.name).not.toMatch(/\.md$/);
		}
		for (const entry of PROJECT_PRD_EVIDENCE) {
			expect(entry.reviewedAt).toBe("2026-10-12");
			expect(entry.mechanisms.length).toBeGreaterThanOrEqual(2);
			expect(entry.mechanisms.length).toBeLessThanOrEqual(3);
			expect(
				PRD_EVIDENCE_COVERAGE.sources.some(({ id }) => id === entry.sourceId),
			).toBe(true);
			expect(entry.historicalEvidence.length).toBeGreaterThan(15);
			expect(entry.currentBoundary.length).toBeGreaterThan(15);
		}
		expect(
			JSON.stringify(PRD_EVIDENCE_COVERAGE) +
				JSON.stringify(PROJECT_PRD_EVIDENCE),
		).not.toMatch(
			/\/Users\/|\/private\/|\/var\/folders\/|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|BEGIN (?:RSA |EC )?PRIVATE KEY/,
		);
	});

	it("preserves independently owned Evidence destinations and adds the shared summary anchor", () => {
		for (const id of [
			"agent-market",
			"office-workflow-agent",
			"personal-ai-agent",
			"babysteps",
		]) {
			const entry = getProjectPrdEvidence(id);
			if (!entry) throw new Error(`Missing project: ${id}`);
			expect(entry?.evidenceUrl).toBe(`https://${id}.baby2b.online/evidence/`);
			expect(projectPrdSummaryUrl(entry)).toBe(
				`https://${id}.baby2b.online/evidence/#prd-design`,
			);
		}
	});

	it("keeps OSS contribution status and the data sandbox design boundary explicit", () => {
		expect(getProjectPrdEvidence("oss-contributions")?.status).toBe(
			"贡献状态按具体 PR 记账",
		);
		expect(getProjectPrdEvidence("agent-data-sandbox")).toMatchObject({
			status: "设计检查点 · 运行验收待核",
			sourceId: "spec-data-sandbox",
			projectUrl: null,
		});
		expect(
			getProjectPrdEvidence("agent-data-sandbox")?.currentBoundary,
		).toContain("当前运行状态未复核");
		expect(
			PRD_EVIDENCE_COVERAGE.sources.find(({ id }) => id === "prd-17")?.kind,
		).toBe("coverage-only");
		expect(getProjectPrdEvidence("prd-17")).toBeUndefined();
	});

	it("keeps unimplemented parser and coverage-only course material out of completed product claims", () => {
		expect(getProjectPrdEvidence("enterprise-document-parser")).toMatchObject({
			status: "文档通过 · 实现待验证",
			projectUrl: null,
		});
		expect(
			getProjectPrdEvidence("enterprise-document-parser")?.currentBoundary,
		).toContain("未实现");
		expect(PRD_EVIDENCE_COVERAGE.courseMaterial).toContain(
			"不新增独立投产项目",
		);
		expect(getProjectPrdEvidence("definitely-unknown")).toBeUndefined();
	});
});
