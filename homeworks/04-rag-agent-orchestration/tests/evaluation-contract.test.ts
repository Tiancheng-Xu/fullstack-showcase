import { describe, expect, it } from "vitest";
import { EvaluationRowSchema } from "../src/evidence/schema.js";

describe("evaluation evidence", () => {
	it("contains paired base and adapter hashes without private prompts", () => {
		const row = EvaluationRowSchema.parse({
			id: "test-001",
			promptSha256: "a".repeat(64),
			base: { responseSha256: "b".repeat(64), latencyMs: 100 },
			adapter: { responseSha256: "c".repeat(64), latencyMs: 90 },
			scores: {
				baseStructure: 0.5,
				adapterStructure: 1,
				baseRefusal: 0,
				adapterRefusal: 0,
			},
		});
		expect(row).not.toHaveProperty("prompt");
		expect(row).not.toHaveProperty("base.response");
	});
});
