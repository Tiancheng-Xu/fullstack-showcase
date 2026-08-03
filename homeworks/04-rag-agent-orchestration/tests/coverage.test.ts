import { describe, expect, it } from "vitest";
import { measureCoverage } from "../src/dataset/coverage.js";
import { SftExampleSchema } from "../src/dataset/schema.js";

describe("formal dataset coverage", () => {
	it("counts capabilities, topics, source groups, multi-turn and boundary rows", () => {
		const singleTurn = SftExampleSchema.parse({
			id: "coverage-learn-001",
			sourceIds: [`sha256:${"1".repeat(64)}`],
			capability: "learn",
			topic: "rag",
			messages: [
				{ role: "system", content: "你是一灯 Agent。" },
				{ role: "user", content: "RAG 是什么？" },
				{
					role: "assistant",
					content:
						"RAG 像开卷考试：先从知识库找到相关资料，再让模型依据资料组织答案。",
				},
			],
			provenance: {
				sourceKind: "course-derived",
				sourceGroup: "rag-basics",
			},
			review: {
				status: "approved",
				reviewedAt: "2026-08-02T18:00:00.000Z",
				rubricVersion: 2,
			},
		});
		const multiTurnBoundary = SftExampleSchema.parse({
			id: "coverage-grill-001",
			sourceIds: [`sha256:${"2".repeat(64)}`],
			capability: "grill-me",
			topic: "agent-behavior",
			messages: [
				{ role: "system", content: "你是一灯 Agent。" },
				{ role: "user", content: "帮我做一个系统。" },
				{ role: "assistant", content: "你希望交付什么结果？" },
				{ role: "user", content: "离线课程问答。" },
				{
					role: "assistant",
					content:
						"我会把离线问答、来源引用和断网验收作为第一版范围，并公开其余假设。",
				},
			],
			provenance: {
				sourceKind: "agent-authored",
				sourceGroup: "grill-protocol",
			},
			review: {
				status: "approved",
				reviewedAt: "2026-08-02T18:00:00.000Z",
				rubricVersion: 2,
			},
		});

		const report = measureCoverage([singleTurn, multiTurnBoundary]);

		expect(report.total).toBe(2);
		expect(report.byCapability.learn).toBe(1);
		expect(report.byCapability["grill-me"]).toBe(1);
		expect(report.byTopic.rag).toBe(1);
		expect(report.bySourceGroup).toEqual({
			"grill-protocol": 1,
			"rag-basics": 1,
		});
		expect(report.multiTurnRatio).toBe(0.5);
		expect(report.boundaryRatio).toBe(0.5);
	});
});
