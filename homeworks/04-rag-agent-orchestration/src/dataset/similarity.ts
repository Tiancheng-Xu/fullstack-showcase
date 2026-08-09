import { createHash } from "node:crypto";

type SimilarityExample = Readonly<{
	id: string;
	messages?: readonly Readonly<{ role: string; content: string }>[];
}>;

export type DuplicateCluster = Readonly<{
	id: string;
	exampleIds: readonly string[];
	maxSimilarity: number;
}>;

function normalizeForSimilarity(value: string): string {
	return value
		.normalize("NFKC")
		.toLowerCase()
		.replace(/[\p{P}\p{S}\s]+/gu, "");
}

export function fingerprintText(value: string): ReadonlySet<string> {
	const normalized = normalizeForSimilarity(value);
	if (normalized.length === 0) {
		return new Set();
	}
	if (normalized.length < 3) {
		return new Set([normalized]);
	}
	const fingerprints = new Set<string>();
	for (let index = 0; index <= normalized.length - 3; index += 1) {
		fingerprints.add(normalized.slice(index, index + 3));
	}
	return fingerprints;
}

export function jaccard(
	left: ReadonlySet<string>,
	right: ReadonlySet<string>,
): number {
	if (left.size === 0 && right.size === 0) {
		return 0;
	}
	let intersection = 0;
	for (const value of left) {
		if (right.has(value)) {
			intersection += 1;
		}
	}
	return intersection / (left.size + right.size - intersection);
}

function comparableText(example: SimilarityExample, role: string): string {
	return (
		example.messages
			?.filter((message) => message.role === role)
			.map((message) => message.content)
			.join("\n") ?? ""
	);
}

function exampleSimilarity(
	left: SimilarityExample,
	right: SimilarityExample,
): number {
	return Math.max(
		jaccard(
			fingerprintText(comparableText(left, "user")),
			fingerprintText(comparableText(right, "user")),
		),
		jaccard(
			fingerprintText(comparableText(left, "assistant")),
			fingerprintText(comparableText(right, "assistant")),
		),
	);
}

export function clusterNearDuplicates(
	examples: readonly SimilarityExample[],
	threshold: number,
): readonly DuplicateCluster[] {
	if (!(threshold > 0 && threshold <= 1)) {
		throw new Error(
			"Similarity threshold must be greater than 0 and at most 1",
		);
	}
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

	const pairSimilarities = new Map<string, number>();
	for (let left = 0; left < examples.length; left += 1) {
		for (let right = left + 1; right < examples.length; right += 1) {
			const similarity = exampleSimilarity(
				examples[left] as SimilarityExample,
				examples[right] as SimilarityExample,
			);
			if (similarity >= threshold) {
				union(left, right);
				pairSimilarities.set(`${left}:${right}`, similarity);
			}
		}
	}

	const groups = new Map<number, number[]>();
	for (const index of examples.keys()) {
		const root = find(index);
		const group = groups.get(root) ?? [];
		group.push(index);
		groups.set(root, group);
	}
	return [...groups.values()]
		.filter((indexes) => indexes.length > 1)
		.map((indexes) => {
			const exampleIds = indexes
				.map((index) => (examples[index] as SimilarityExample).id)
				.sort();
			let maxSimilarity = 0;
			for (const left of indexes) {
				for (const right of indexes) {
					maxSimilarity = Math.max(
						maxSimilarity,
						pairSimilarities.get(
							`${Math.min(left, right)}:${Math.max(left, right)}`,
						) ?? 0,
					);
				}
			}
			return {
				id: `near-${createHash("sha256").update(exampleIds.join(",")).digest("hex").slice(0, 16)}`,
				exampleIds,
				maxSimilarity,
			};
		})
		.sort((left, right) => left.id.localeCompare(right.id));
}
