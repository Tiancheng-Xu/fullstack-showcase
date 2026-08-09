import { z } from "zod";

const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const score = z.number().min(0).max(1);

export const EvaluationRowSchema = z.object({
	id: z.string().min(1),
	promptSha256: sha256,
	base: z.object({
		responseSha256: sha256,
		latencyMs: z.number().nonnegative(),
	}),
	adapter: z.object({
		responseSha256: sha256,
		latencyMs: z.number().nonnegative(),
	}),
	scores: z.object({
		baseStructure: score,
		adapterStructure: score,
		baseRefusal: score,
		adapterRefusal: score,
	}),
});
