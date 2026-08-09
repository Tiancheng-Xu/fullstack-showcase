import { describe, expect, it } from "vitest";
import {
	clusterNearDuplicates,
	fingerprintText,
	jaccard,
} from "../src/dataset/similarity.js";

describe("near-duplicate similarity", () => {
	it("treats punctuation changes and a small wording change as highly similar", () => {
		const left = fingerprintText("RAG 为什么需要加入 Rerank 重排步骤？");
		const right = fingerprintText("RAG为什么需要加入 Rerank 重排流程");

		expect(jaccard(left, right)).toBeGreaterThanOrEqual(0.72);
		expect(
			jaccard(left, fingerprintText("如何在 CUDA 上检查可用显存")),
		).toBeLessThan(0.2);
	});

	it("clusters transitively similar examples", () => {
		const clusters = clusterNearDuplicates(
			[
				{
					id: "a",
					messages: [
						{ role: "user", content: "RAG 为什么需要加入 Rerank 重排步骤？" },
					],
				},
				{
					id: "b",
					messages: [
						{ role: "user", content: "RAG为什么需要加入 Rerank 重排流程" },
					],
				},
				{
					id: "c",
					messages: [{ role: "user", content: "怎样验证 CUDA 驱动版本？" }],
				},
			],
			0.72,
		);

		expect(clusters).toHaveLength(1);
		expect(clusters[0]?.exampleIds).toEqual(["a", "b"]);
	});
});
