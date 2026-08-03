import { describe, expect, it } from "vitest";
import { assertNoLeakage } from "../src/dataset/leakage.js";
import { splitBySource } from "../src/dataset/split.js";

describe("dataset splitting", () => {
	it("keeps transitively shared sources in the same split", () => {
		const examples = [
			{ id: "a", sourceIds: [`sha256:${"1".repeat(64)}`] },
			{
				id: "b",
				sourceIds: [`sha256:${"1".repeat(64)}`, `sha256:${"2".repeat(64)}`],
			},
			{ id: "c", sourceIds: [`sha256:${"2".repeat(64)}`] },
			{ id: "d", sourceIds: [`sha256:${"3".repeat(64)}`] },
			{ id: "e", sourceIds: [`sha256:${"4".repeat(64)}`] },
		];
		const splits = splitBySource(examples, {
			seed: 20260802,
			ratios: [0.8, 0.1, 0.1],
		});
		expect(() => assertNoLeakage(splits)).not.toThrow();
		const splitNames = ["train", "validation", "test"] as const;
		const location = (id: string) =>
			splitNames.find((name) =>
				splits[name].some((example) => example.id === id),
			);
		expect(location("a")).toBe(location("b"));
		expect(location("b")).toBe(location("c"));
	});

	it("rejects normalized question leakage across splits", () => {
		const make = (id: string, question: string) => ({
			id,
			sourceIds: [`sha256:${id.repeat(64)}`],
			messages: [
				{ role: "system", content: "system" },
				{ role: "user", content: question },
				{ role: "assistant", content: `answer-${id}` },
			],
		});
		expect(() =>
			assertNoLeakage({
				train: [make("a", "什么是 RAG？")],
				validation: [make("b", "  什么是   rag? ")],
				test: [make("c", "另一个问题")],
			}),
		).toThrow(/question/);
	});

	it("rejects near-duplicate question leakage across splits", () => {
		const make = (id: string, question: string) => ({
			id,
			sourceIds: [`sha256:${id.repeat(64)}`],
			messages: [
				{ role: "system", content: "system" },
				{ role: "user", content: question },
				{ role: "assistant", content: `独立回答内容-${id.repeat(16)}` },
			],
		});
		expect(() =>
			assertNoLeakage({
				train: [make("a", "RAG 为什么需要加入 Rerank 重排步骤？")],
				validation: [make("b", "RAG为什么需要加入 Rerank 重排流程")],
				test: [make("c", "怎样验证 CUDA 驱动版本？")],
			}),
		).toThrow(/Near-duplicate question leakage/);
	});

	it("keeps an explicit near-duplicate cluster in one split", () => {
		const examples = [
			{
				id: "a",
				sourceIds: [`sha256:${"1".repeat(64)}`],
				duplicateClusterId: "near-rag",
			},
			{
				id: "b",
				sourceIds: [`sha256:${"2".repeat(64)}`],
				duplicateClusterId: "near-rag",
			},
			{ id: "c", sourceIds: [`sha256:${"3".repeat(64)}`] },
			{ id: "d", sourceIds: [`sha256:${"4".repeat(64)}`] },
		];
		const splits = splitBySource(examples, {
			seed: 20260802,
			ratios: [0.8, 0.1, 0.1],
		});
		const location = (id: string) =>
			(["train", "validation", "test"] as const).find((name) =>
				splits[name].some((example) => example.id === id),
			);

		expect(location("a")).toBe(location("b"));
	});
});
