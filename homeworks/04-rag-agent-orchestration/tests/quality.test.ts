import { describe, expect, it } from "vitest";
import { assertFormalQuality } from "../src/dataset/quality.js";
import {
	type Capability,
	type KnowledgeTopic,
	SftExampleSchema,
} from "../src/dataset/schema.js";

const capabilities: readonly Capability[] = [
	"learn",
	"interview",
	"architecture",
	"execute",
	"grill-me",
	"verification",
	"memory",
	"safety",
];

const topics: readonly KnowledgeTopic[] = [
	"ai-foundations",
	"rag",
	"agent-behavior",
	"mastra",
	"langchain",
	"langgraph",
	"frontend",
	"backend",
	"cloud",
	"web3",
	"training",
	"harness-engineering",
	"career",
	"cross-topic",
];

function makeFormalRows(count: number) {
	return Array.from({ length: count }, (_, index) => {
		const suffix = index.toString(16).padStart(64, "0");
		return SftExampleSchema.parse({
			id: `formal-quality-${String(index + 1).padStart(3, "0")}`,
			sourceIds: [`sha256:${suffix}`],
			capability: capabilities[index % capabilities.length],
			topic: topics[index % topics.length],
			messages: [
				{ role: "system", content: "你是一灯 Agent。" },
				{ role: "user", content: `请解释课程知识点 ${index + 1}。` },
				{
					role: "assistant",
					content: `先给结论，再用大白话解释核心原理、适用边界和一个可验证的实践步骤。这是第 ${index + 1} 条独立回答。`,
				},
			],
			provenance: {
				sourceKind: "course-derived",
				sourceGroup: `course-group-${index % 30}`,
			},
			review: {
				status: "approved",
				reviewedAt: "2026-08-02T18:00:00.000Z",
				rubricVersion: 2,
			},
		});
	});
}

describe("formal dataset quality", () => {
	it("rejects 299 otherwise valid training rows", () => {
		expect(() => assertFormalQuality(makeFormalRows(299))).toThrow(
			"Formal train requires at least 300 approved examples",
		);
	});

	it("accepts 300 reviewed rows covering every required capability", () => {
		expect(() => assertFormalQuality(makeFormalRows(300))).not.toThrow();
	});
});
