import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { scanOutboundText } from "../corpus/safety.js";
import {
	type SftExample,
	SftExampleSchema,
	type TrainingRecord,
} from "./schema.js";

export function validateForExport(input: unknown): TrainingRecord {
	const example = SftExampleSchema.parse(input);
	if (example.review.status !== "approved") {
		throw new Error(`Example ${example.id} is not approved`);
	}
	for (const message of example.messages) {
		if (scanOutboundText(message.content).length > 0) {
			throw new Error(`Example ${example.id} failed outbound safety checks`);
		}
	}
	return { messages: example.messages };
}

export function validateReviewedExamples(
	inputs: readonly unknown[],
): readonly SftExample[] {
	return inputs.map((input) => {
		const example = SftExampleSchema.parse(input);
		validateForExport(example);
		return example;
	});
}

async function main(): Promise<void> {
	const homeworkRoot = fileURLToPath(new URL("../../", import.meta.url));
	const inputPath =
		process.env.RAG_REVIEWED_PATH ??
		`${homeworkRoot}/data/private/reviewed.jsonl`;
	const lines = (await readFile(inputPath, "utf8"))
		.split(/\r?\n/u)
		.filter((line) => line.trim().length > 0);
	const examples = validateReviewedExamples(
		lines.map((line) => JSON.parse(line)),
	);
	process.stdout.write(
		`${JSON.stringify({ approved: examples.length, inputPath })}\n`,
	);
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	await main();
}
