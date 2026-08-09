import { describe, expect, it } from "vitest";
import {
	DatasetReleaseSchema,
	selectReplayExampleIds,
} from "../src/dataset/release.js";

const split = { rows: 5, sha256: "a".repeat(64) };

describe("incremental dataset releases", () => {
	it("records a parent adapter and keeps new and replay examples disjoint", () => {
		const release = DatasetReleaseSchema.parse({
			schemaVersion: 1,
			releaseId: "rag-sft-20260802-v2",
			createdAt: "2026-08-02T12:00:00.000Z",
			baseModel: "Qwen/Qwen3-8B",
			parent: {
				datasetReleaseId: "rag-sft-20260802-v1",
				adapterSha256: "b".repeat(64),
			},
			composition: {
				newExampleIds: ["new-001"],
				replayExampleIds: ["old-001"],
			},
			splits: { train: split, validation: split, test: split },
		});
		expect(release.parent?.datasetReleaseId).toBe("rag-sft-20260802-v1");
		expect(() =>
			DatasetReleaseSchema.parse({
				...release,
				composition: { newExampleIds: ["same"], replayExampleIds: ["same"] },
			}),
		).toThrow(/disjoint/);
	});

	it("selects a deterministic replay subset without mutating prior IDs", () => {
		const previous = ["old-1", "old-2", "old-3", "old-4"];
		const first = selectReplayExampleIds(previous, {
			count: 2,
			seed: 20260802,
		});
		const second = selectReplayExampleIds(previous, {
			count: 2,
			seed: 20260802,
		});
		expect(first).toEqual(second);
		expect(first).toHaveLength(2);
		expect(new Set(first).size).toBe(2);
		expect(first.every((id) => previous.includes(id))).toBe(true);
		expect(previous).toEqual(["old-1", "old-2", "old-3", "old-4"]);
	});
});
