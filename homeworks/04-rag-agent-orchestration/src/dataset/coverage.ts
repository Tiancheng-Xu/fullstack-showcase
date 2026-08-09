import {
	CapabilitySchema,
	KnowledgeTopicSchema,
	type SftExample,
} from "./schema.js";

type AnswerLengthPercentiles = Readonly<{
	p50: number;
	p90: number;
	p95: number;
}>;

export type CoverageReport = Readonly<{
	total: number;
	approved: number;
	byCapability: Readonly<
		Record<(typeof CapabilitySchema.options)[number], number>
	>;
	byTopic: Readonly<
		Record<(typeof KnowledgeTopicSchema.options)[number], number>
	>;
	bySourceGroup: Readonly<Record<string, number>>;
	multiTurnRatio: number;
	boundaryRatio: number;
	answerLengthPercentiles: AnswerLengthPercentiles;
}>;

function zeroCounts<const T extends readonly string[]>(
	values: T,
): Record<T[number], number> {
	return Object.fromEntries(values.map((value) => [value, 0])) as Record<
		T[number],
		number
	>;
}

function percentile(sorted: readonly number[], ratio: number): number {
	if (sorted.length === 0) {
		return 0;
	}
	const index = Math.max(0, Math.ceil(sorted.length * ratio) - 1);
	return sorted[index] ?? 0;
}

export function measureCoverage(
	examples: readonly SftExample[],
): CoverageReport {
	const byCapability = zeroCounts(CapabilitySchema.options);
	const byTopic = zeroCounts(KnowledgeTopicSchema.options);
	const sourceGroups = new Map<string, number>();
	const answerLengths: number[] = [];
	let approved = 0;
	let multiTurn = 0;
	let boundary = 0;
	const boundaryCapabilities = new Set(["grill-me", "verification", "safety"]);

	for (const example of examples) {
		byCapability[example.capability] += 1;
		byTopic[example.topic] += 1;
		sourceGroups.set(
			example.provenance.sourceGroup,
			(sourceGroups.get(example.provenance.sourceGroup) ?? 0) + 1,
		);
		if (example.review.status === "approved") {
			approved += 1;
		}
		if (example.messages.length > 3) {
			multiTurn += 1;
		}
		if (boundaryCapabilities.has(example.capability)) {
			boundary += 1;
		}
		answerLengths.push(example.messages.at(-1)?.content.length ?? 0);
	}

	answerLengths.sort((left, right) => left - right);
	return {
		total: examples.length,
		approved,
		byCapability,
		byTopic,
		bySourceGroup: Object.fromEntries(
			[...sourceGroups.entries()].sort(([left], [right]) =>
				left.localeCompare(right),
			),
		),
		multiTurnRatio: examples.length === 0 ? 0 : multiTurn / examples.length,
		boundaryRatio: examples.length === 0 ? 0 : boundary / examples.length,
		answerLengthPercentiles: {
			p50: percentile(answerLengths, 0.5),
			p90: percentile(answerLengths, 0.9),
			p95: percentile(answerLengths, 0.95),
		},
	};
}
