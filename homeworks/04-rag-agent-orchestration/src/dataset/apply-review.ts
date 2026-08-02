import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { z } from "zod";
import { validateForExport } from "./review.js";
import { type SftExample, SftExampleSchema } from "./schema.js";

type ReviewOptions = Readonly<{
	prefix: string;
	approvedIds: ReadonlySet<string>;
	reviewedAt: string;
}>;

export function applyReviewDecisions(
	inputs: readonly unknown[],
	options: ReviewOptions,
): Readonly<{
	approved: readonly SftExample[];
	rejected: readonly Readonly<{ id: string; reason: string }>[];
}> {
	if (!/^[a-z0-9-]+$/u.test(options.prefix)) {
		throw new Error(
			"Review prefix must be lowercase letters, numbers or hyphens",
		);
	}
	const drafts = inputs.map((input) => SftExampleSchema.parse(input));
	const availableIds = new Set(drafts.map((draft) => draft.id));
	for (const approvedId of options.approvedIds) {
		if (!availableIds.has(approvedId)) {
			throw new Error(`Approved ID does not exist: ${approvedId}`);
		}
	}
	const approved: SftExample[] = [];
	const rejected: { id: string; reason: string }[] = [];
	for (const draft of drafts) {
		const id = `${options.prefix}-${draft.id}`;
		if (!options.approvedIds.has(draft.id)) {
			rejected.push({ id, reason: "not explicitly approved" });
			continue;
		}
		const reviewed = SftExampleSchema.parse({
			...draft,
			id,
			review: { status: "approved", reviewedAt: options.reviewedAt },
		});
		validateForExport(reviewed);
		approved.push(reviewed);
	}
	return { approved, rejected };
}

const DecisionsSchema = z.object({
	reviewedAt: z.iso.datetime(),
	sources: z.array(
		z.object({
			file: z.string().min(1),
			prefix: z.string().regex(/^[a-z0-9-]+$/),
			approvedIds: z.array(z.string().min(1)),
		}),
	),
});

function resolveInsideHomework(homeworkRoot: string, file: string): string {
	const resolved = path.resolve(homeworkRoot, file);
	const relative = path.relative(homeworkRoot, resolved);
	if (relative.startsWith("..") || path.isAbsolute(relative)) {
		throw new Error("Review source must be inside the homework node");
	}
	return resolved;
}

async function main(): Promise<void> {
	const homeworkRoot = fileURLToPath(new URL("../../", import.meta.url));
	const decisionsPath = path.join(
		homeworkRoot,
		"data/private/review-decisions.json",
	);
	const decisions = DecisionsSchema.parse(
		JSON.parse(await readFile(decisionsPath, "utf8")),
	);
	const approved: SftExample[] = [];
	const rejected: { id: string; reason: string }[] = [];
	for (const source of decisions.sources) {
		const rows = (
			await readFile(resolveInsideHomework(homeworkRoot, source.file), "utf8")
		)
			.trim()
			.split(/\r?\n/u)
			.map((line) => JSON.parse(line));
		const result = applyReviewDecisions(rows, {
			prefix: source.prefix,
			approvedIds: new Set(source.approvedIds),
			reviewedAt: decisions.reviewedAt,
		});
		approved.push(...result.approved);
		rejected.push(...result.rejected);
	}
	if (new Set(approved.map((row) => row.id)).size !== approved.length) {
		throw new Error("Reviewed example IDs must be unique");
	}
	await writeFile(
		path.join(homeworkRoot, "data/private/reviewed.jsonl"),
		`${approved.map((row) => JSON.stringify(row)).join("\n")}\n`,
		"utf8",
	);
	await writeFile(
		path.join(homeworkRoot, "data/private/rejected.json"),
		`${JSON.stringify(rejected, null, 2)}\n`,
		"utf8",
	);
	process.stdout.write(
		`${JSON.stringify({ approved: approved.length, rejected: rejected.length })}\n`,
	);
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	await main();
}
