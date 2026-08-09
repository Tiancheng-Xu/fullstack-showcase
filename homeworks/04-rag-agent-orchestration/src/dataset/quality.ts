import { CapabilitySchema, type SftExample } from "./schema.js";

const minimumFormalTrainRows = 300;
const minimumAnswerLength = 40;
const placeholderPattern = /\b(?:TODO|TBD)\b|待补充/iu;

export function assertFormalQuality(examples: readonly SftExample[]): void {
	if (examples.length < minimumFormalTrainRows) {
		throw new Error(
			`Formal train requires at least ${minimumFormalTrainRows} approved examples`,
		);
	}

	const seenIds = new Set<string>();
	const coveredCapabilities = new Set<string>();
	for (const example of examples) {
		if (example.review.status !== "approved") {
			throw new Error(`Example ${example.id} is not approved`);
		}
		if (example.review.rubricVersion < 2) {
			throw new Error(`Example ${example.id} requires rubric version 2 review`);
		}
		if (seenIds.has(example.id)) {
			throw new Error(`Duplicate example ID: ${example.id}`);
		}
		seenIds.add(example.id);
		coveredCapabilities.add(example.capability);
		if (example.provenance.sourceGroup.trim().length === 0) {
			throw new Error(`Example ${example.id} requires a source group`);
		}
		const answer = example.messages.at(-1)?.content ?? "";
		if (answer.length < minimumAnswerLength) {
			throw new Error(
				`Example ${example.id} answer must contain at least ${minimumAnswerLength} characters`,
			);
		}
		if (placeholderPattern.test(answer)) {
			throw new Error(`Example ${example.id} contains placeholder text`);
		}
	}

	const missingCapabilities = CapabilitySchema.options.filter(
		(capability) => !coveredCapabilities.has(capability),
	);
	if (missingCapabilities.length > 0) {
		throw new Error(
			`Formal train is missing capabilities: ${missingCapabilities.join(", ")}`,
		);
	}
}
