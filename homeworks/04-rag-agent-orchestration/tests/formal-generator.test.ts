import { describe, expect, it } from "vitest";
import type { CoverageCell } from "../src/dataset/draft.js";
import {
	buildFormalExample,
	parseFormalDraftResponse,
	selectFormalDraftSource,
} from "../src/dataset/formal-generator.js";

const cell: CoverageCell = {
	id: "agenda-0007",
	capability: "grill-me",
	topic: "agent-behavior",
	sourceGroup: "07-AI智能客服实战",
	interaction: "multi-turn",
};

describe("formal draft generation", () => {
	it("parses a fenced multi-turn response with alternating roles", () => {
		const parsed = parseFormalDraftResponse(
			'```json\n{"messages":[{"role":"user","content":"帮我做一个 Agent。"},{"role":"assistant","content":"你希望交付什么可验收结果？"},{"role":"user","content":"离线课程问答。"},{"role":"assistant","content":"我会以断网问答和来源引用作为第一版验收。"}]}\n```',
			"multi-turn",
		);

		expect(parsed.messages).toHaveLength(4);
		expect(parsed.messages.at(-1)?.role).toBe("assistant");
	});

	it("selects a deterministic unique-content source from the requested group", () => {
		const selected = selectFormalDraftSource(cell, [
			{
				relativePath: "07-AI智能客服实战/a.md",
				contentSha256: "a".repeat(64),
			},
			{
				relativePath: "07-AI智能客服实战/a-copy.md",
				contentSha256: "a".repeat(64),
			},
			{
				relativePath: "07-AI智能客服实战/b.md",
				contentSha256: "b".repeat(64),
			},
			{
				relativePath: "03-AI全栈工程师/ignored.md",
				contentSha256: "c".repeat(64),
			},
		]);

		expect(selected.relativePath.startsWith("07-AI智能客服实战/")).toBe(true);
		expect(["a".repeat(64), "b".repeat(64)]).toContain(selected.contentSha256);
	});

	it("builds a formal draft with source hash and rubric version two", () => {
		const response = parseFormalDraftResponse(
			'{"messages":[{"role":"user","content":"帮我做一个 Agent。"},{"role":"assistant","content":"你希望交付什么可验收结果？"},{"role":"user","content":"离线课程问答。"},{"role":"assistant","content":"我会以断网问答和来源引用作为第一版验收。"}]}',
			"multi-turn",
		);
		const example = buildFormalExample(
			cell,
			{
				relativePath: "07-AI智能客服实战/lesson.md",
				contentSha256: "d".repeat(64),
			},
			response,
		);

		expect(example).toMatchObject({
			id: "formal-0007",
			capability: "grill-me",
			topic: "agent-behavior",
			sourceIds: [`sha256:${"d".repeat(64)}`],
			provenance: {
				sourceKind: "course-derived",
				sourceGroup: "07-AI智能客服实战",
			},
			review: { status: "draft", rubricVersion: 2 },
		});
		expect(example.messages).toHaveLength(5);
	});
});
