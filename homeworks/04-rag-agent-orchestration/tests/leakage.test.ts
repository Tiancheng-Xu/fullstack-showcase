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
});
