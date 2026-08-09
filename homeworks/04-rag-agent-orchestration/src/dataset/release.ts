import { createHash } from "node:crypto";
import { z } from "zod";

const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const releaseId = z.string().regex(/^rag-sft-\d{8}-v[1-9]\d*$/);
const splitDescriptor = z.object({
	rows: z.number().int().nonnegative(),
	sha256,
});

export const DatasetReleaseSchema = z
	.object({
		schemaVersion: z.literal(1),
		releaseId,
		createdAt: z.iso.datetime(),
		baseModel: z.literal("Qwen/Qwen3-8B"),
		parent: z
			.object({ datasetReleaseId: releaseId, adapterSha256: sha256 })
			.nullable(),
		composition: z.object({
			newExampleIds: z.array(z.string().min(1)).min(1),
			replayExampleIds: z.array(z.string().min(1)),
		}),
		splits: z.object({
			train: splitDescriptor,
			validation: splitDescriptor,
			test: splitDescriptor,
		}),
	})
	.superRefine((release, context) => {
		const newIds = new Set(release.composition.newExampleIds);
		const replayIds = new Set(release.composition.replayExampleIds);
		if (newIds.size !== release.composition.newExampleIds.length) {
			context.addIssue({
				code: "custom",
				path: ["composition", "newExampleIds"],
				message: "IDs must be unique",
			});
		}
		if (replayIds.size !== release.composition.replayExampleIds.length) {
			context.addIssue({
				code: "custom",
				path: ["composition", "replayExampleIds"],
				message: "IDs must be unique",
			});
		}
		if ([...newIds].some((id) => replayIds.has(id))) {
			context.addIssue({
				code: "custom",
				path: ["composition"],
				message: "New and replay IDs must be disjoint",
			});
		}
	});

export function selectReplayExampleIds(
	previousTrainIds: readonly string[],
	options: Readonly<{ count: number; seed: number }>,
): readonly string[] {
	if (
		!Number.isInteger(options.count) ||
		options.count < 0 ||
		options.count > previousTrainIds.length
	) {
		throw new Error("Replay count must fit within the previous training set");
	}
	const uniqueIds = new Set(previousTrainIds);
	if (uniqueIds.size !== previousTrainIds.length) {
		throw new Error("Previous training IDs must be unique");
	}
	return [...previousTrainIds]
		.sort((left, right) => {
			const leftHash = createHash("sha256")
				.update(`${options.seed}:${left}`)
				.digest("hex");
			const rightHash = createHash("sha256")
				.update(`${options.seed}:${right}`)
				.digest("hex");
			return leftHash.localeCompare(rightHash);
		})
		.slice(0, options.count);
}
