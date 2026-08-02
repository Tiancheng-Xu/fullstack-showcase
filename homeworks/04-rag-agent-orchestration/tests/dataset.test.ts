import { describe, expect, it } from "vitest";
import { applyReviewDecisions } from "../src/dataset/apply-review.js";
import {
	expandDraftJobs,
	normalizeDraftTopic,
	parseDraftResponse,
	selectDraftSources,
} from "../src/dataset/draft.js";
import { validateForExport } from "../src/dataset/review.js";
import { SftExampleSchema } from "../src/dataset/schema.js";

const example = {
	id: "architecture-001",
	sourceIds: [`sha256:${"a".repeat(64)}`],
	topic: "architecture",
	messages: [
		{ role: "system", content: "区分课程事实、官方事实和推导。" },
		{ role: "user", content: "RAG 和微调怎么分工？" },
		{
			role: "assistant",
			content: "微调稳定回答方式，RAG 提供可更新且可引用的事实。",
		},
	],
	review: { status: "approved", reviewedAt: "2026-08-02T00:00:00.000Z" },
};

describe("SFT dataset", () => {
	it("normalizes model-generated topic labels into the closed training taxonomy", () => {
		expect(normalizeDraftTopic("架构")).toBe("architecture");
		expect(normalizeDraftTopic("unknown-label")).toBe("learn");
	});

	it("accepts a JSON object wrapped only in a Markdown JSON fence", () => {
		expect(
			parseDraftResponse(
				'```json\n{"topic":"learn","user":"什么是 RAG？","assistant":"检索后生成。"}\n```',
			),
		).toEqual({
			topic: "learn",
			user: "什么是 RAG？",
			assistant: "检索后生成。",
		});
	});

	it("selects relevant draft sources and removes exact duplicates", () => {
		expect(
			selectDraftSources(
				[
					{
						relativePath: "RAG/a.md",
						byteLength: 500,
						contentSha256: "a".repeat(64),
					},
					{
						relativePath: "RAG/copy.md",
						byteLength: 600,
						contentSha256: "a".repeat(64),
					},
					{
						relativePath: "Web/b.md",
						byteLength: 500,
						contentSha256: "b".repeat(64),
					},
				],
				{ limit: 10, pathPattern: /RAG/u },
			),
		).toEqual([
			{
				relativePath: "RAG/a.md",
				byteLength: 500,
				contentSha256: "a".repeat(64),
			},
		]);
	});

	it("expands each source into distinct learning, architecture and boundary jobs", () => {
		const source = {
			relativePath: "RAG/a.md",
			byteLength: 500,
			contentSha256: "a".repeat(64),
		};
		expect(expandDraftJobs([source], 3)).toEqual([
			{ source, variant: "concept" },
			{ source, variant: "architecture" },
			{ source, variant: "boundary" },
		]);
	});

	it("accepts an approved three-message example with provenance", () => {
		expect(SftExampleSchema.parse(example)).toEqual(example);
	});

	it("rejects drafts from the outbound training payload", () => {
		expect(() =>
			validateForExport({ ...example, review: { status: "draft" } }),
		).toThrow(/approved/);
	});

	it("exports messages only and rejects safety findings", () => {
		expect(validateForExport(example)).toEqual({ messages: example.messages });
		expect(() =>
			validateForExport({
				...example,
				messages: [
					example.messages[0],
					example.messages[1],
					{ role: "assistant", content: "password=example-passphrase" },
				],
			}),
		).toThrow(/safety/);
	});

	it("approves only explicitly listed draft IDs and prefixes release-local IDs", () => {
		const decisions = applyReviewDecisions(
			[example, { ...example, id: "architecture-002" }],
			{
				prefix: "focused",
				approvedIds: new Set(["architecture-001"]),
				reviewedAt: "2026-08-02T12:00:00.000Z",
			},
		);
		expect(decisions.approved.map((row) => row.id)).toEqual([
			"focused-architecture-001",
		]);
		expect(decisions.rejected).toEqual([
			{ id: "focused-architecture-002", reason: "not explicitly approved" },
		]);
	});
});
