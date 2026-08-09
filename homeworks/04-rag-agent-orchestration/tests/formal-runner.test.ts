import { describe, expect, it } from "vitest";
import type { CoverageCell } from "../src/dataset/draft.js";
import { generateFormalDraft } from "../src/dataset/formal-runner.js";

describe("formal draft runner", () => {
	it("turns a local chat response into a traceable formal example", async () => {
		const cell: CoverageCell = {
			id: "agenda-0042",
			capability: "learn",
			topic: "rag",
			sourceGroup: "07-AI智能客服实战",
			interaction: "single-turn",
		};
		const example = await generateFormalDraft({
			cell,
			source: {
				relativePath: "07-AI智能客服实战/rag.md",
				contentSha256: "e".repeat(64),
			},
			excerpt: "RAG 包括检索和生成两个主要阶段。",
			request: async () =>
				'{"messages":[{"role":"user","content":"RAG 可以怎样理解？"},{"role":"assistant","content":"可以把 RAG 理解成开卷考试：先检索相关资料，再让模型依据资料组织回答，同时保留来源和知识边界。"}]}',
		});

		expect(example).toMatchObject({
			id: "formal-0042",
			capability: "learn",
			topic: "rag",
			sourceIds: [`sha256:${"e".repeat(64)}`],
		});
		expect(example.messages.at(-1)?.content).toContain("开卷考试");
	});
});
