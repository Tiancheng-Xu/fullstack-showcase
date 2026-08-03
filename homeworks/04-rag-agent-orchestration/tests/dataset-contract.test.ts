import { describe, expect, it } from "vitest";
import { SftExampleSchema } from "../src/dataset/schema.js";

describe("formal SFT contract", () => {
	it("accepts an approved grill-me conversation with traceable provenance", () => {
		const parsed = SftExampleSchema.parse({
			id: "formal-grill-001",
			sourceIds: [`sha256:${"a".repeat(64)}`],
			capability: "grill-me",
			topic: "agent-behavior",
			messages: [
				{ role: "system", content: "你是一灯 Agent。" },
				{ role: "user", content: "帮我做项目。" },
				{ role: "assistant", content: "你希望交付什么可验收结果？" },
				{ role: "user", content: "做一个离线课程助理。" },
				{
					role: "assistant",
					content: "我将以离线问答和来源引用作为第一版验收。",
				},
			],
			provenance: {
				sourceKind: "course-derived",
				sourceGroup: "agent-design",
			},
			review: {
				status: "approved",
				reviewedAt: "2026-08-02T18:00:00.000Z",
				rubricVersion: 2,
			},
		});

		expect(parsed.capability).toBe("grill-me");
		expect(parsed.messages).toHaveLength(5);
		expect(parsed.provenance.sourceGroup).toBe("agent-design");
	});

	it("normalizes a v1 row into the formal contract without changing its messages", () => {
		const messages = [
			{ role: "system", content: "你是一名学习助理。" },
			{ role: "user", content: "什么是 RAG？" },
			{
				role: "assistant",
				content: "RAG 是先检索资料，再让模型依据资料回答。",
			},
		] as const;
		const parsed = SftExampleSchema.parse({
			id: "legacy-learn-001",
			sourceIds: [`sha256:${"b".repeat(64)}`],
			topic: "learn",
			messages,
			review: {
				status: "approved",
				reviewedAt: "2026-08-02T18:00:00.000Z",
			},
		});

		expect(parsed.capability).toBe("learn");
		expect(parsed.topic).toBe("cross-topic");
		expect(parsed.messages).toEqual(messages);
		expect(parsed.provenance).toEqual({
			sourceKind: "legacy-derived",
			sourceGroup: "rag-sft-20260802-v1",
		});
	});
});
