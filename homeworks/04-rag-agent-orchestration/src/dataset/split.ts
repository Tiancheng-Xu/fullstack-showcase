import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assertNoLeakage } from "./leakage.js";
import { validateReviewedExamples } from "./review.js";

export type SplitExample = Readonly<{
	id: string;
	sourceIds: readonly string[];
	messages?: readonly Readonly<{ role: string; content: string }>[];
}>;

export type DatasetSplits<T extends SplitExample> = Readonly<{
	train: readonly T[];
	validation: readonly T[];
	test: readonly T[];
}>;

function connectedComponents<T extends SplitExample>(
	examples: readonly T[],
): readonly (readonly T[])[] {
	const parents = examples.map((_, index) => index);
	const find = (index: number): number => {
		let current = index;
		while (parents[current] !== current) {
			current = parents[current] ?? current;
		}
		return current;
	};
	const union = (left: number, right: number): void => {
		const leftRoot = find(left);
		const rightRoot = find(right);
		if (leftRoot !== rightRoot) {
			parents[rightRoot] = leftRoot;
		}
	};
	const sourceOwners = new Map<string, number>();
	for (const [index, example] of examples.entries()) {
		for (const sourceId of example.sourceIds) {
			const owner = sourceOwners.get(sourceId);
			if (owner === undefined) {
				sourceOwners.set(sourceId, index);
			} else {
				union(index, owner);
			}
		}
	}
	const groups = new Map<number, T[]>();
	for (const [index, example] of examples.entries()) {
		const root = find(index);
		const group = groups.get(root) ?? [];
		group.push(example);
		groups.set(root, group);
	}
	return [...groups.values()];
}

export function splitBySource<T extends SplitExample>(
	examples: readonly T[],
	options: Readonly<{
		seed: number;
		ratios: readonly [number, number, number];
	}>,
): DatasetSplits<T> {
	const ratioTotal = options.ratios.reduce((sum, ratio) => sum + ratio, 0);
	if (Math.abs(ratioTotal - 1) > 0.000_001) {
		throw new Error("Split ratios must sum to 1");
	}
	const components = [...connectedComponents(examples)].sort((left, right) => {
		const digest = (group: readonly T[]) =>
			createHash("sha256")
				.update(
					`${options.seed}:${group
						.map((example) => example.id)
						.sort()
						.join(",")}`,
				)
				.digest("hex");
		return digest(left).localeCompare(digest(right));
	});
	if (components.length < 3) {
		throw new Error("At least three independent source groups are required");
	}

	const buckets: T[][] = [[], [], []];
	for (const [index, component] of components.entries()) {
		let bucketIndex = index;
		if (index >= buckets.length) {
			const deficits = options.ratios.map(
				(ratio, candidate) =>
					ratio * examples.length - (buckets[candidate]?.length ?? 0),
			);
			bucketIndex = deficits.indexOf(Math.max(...deficits));
		}
		buckets[bucketIndex]?.push(...component);
	}
	return {
		train: buckets[0] ?? [],
		validation: buckets[1] ?? [],
		test: buckets[2] ?? [],
	};
}

async function main(): Promise<void> {
	const homeworkRoot = fileURLToPath(new URL("../../", import.meta.url));
	const inputPath = path.join(homeworkRoot, "data/private/reviewed.jsonl");
	const lines = (await readFile(inputPath, "utf8")).trim().split(/\r?\n/u);
	const examples = validateReviewedExamples(
		lines.map((line) => JSON.parse(line)),
	);
	const splits = splitBySource(examples, {
		seed: 20260802,
		ratios: [0.8, 0.1, 0.1],
	});
	assertNoLeakage(splits);
	for (const [name, rows] of Object.entries(splits)) {
		await writeFile(
			path.join(homeworkRoot, `data/private/${name}.jsonl`),
			`${rows.map((row) => JSON.stringify(row)).join("\n")}\n`,
			"utf8",
		);
	}
	await writeFile(
		path.join(homeworkRoot, "data/private/split-report.json"),
		`${JSON.stringify({ seed: 20260802, counts: Object.fromEntries(Object.entries(splits).map(([name, rows]) => [name, rows.length])) }, null, 2)}\n`,
		"utf8",
	);
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	await main();
}
