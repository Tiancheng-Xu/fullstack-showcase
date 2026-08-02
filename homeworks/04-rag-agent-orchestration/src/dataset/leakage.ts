import type { DatasetSplits, SplitExample } from "./split.js";

function normalize(value: string): string {
	return value.normalize("NFKC").trim().toLowerCase().replace(/\s+/gu, " ");
}

export function assertNoLeakage<T extends SplitExample>(
	splits: DatasetSplits<T>,
): void {
	const seenIds = new Map<string, string>();
	const seenSources = new Map<string, string>();
	const seenQuestions = new Map<string, string>();
	const seenAnswers = new Map<string, string>();
	for (const [splitName, examples] of Object.entries(splits)) {
		for (const example of examples) {
			const priorId = seenIds.get(example.id);
			if (priorId && priorId !== splitName) {
				throw new Error(
					`Example ID leakage between ${priorId} and ${splitName}`,
				);
			}
			seenIds.set(example.id, splitName);
			for (const sourceId of example.sourceIds) {
				const priorSource = seenSources.get(sourceId);
				if (priorSource && priorSource !== splitName) {
					throw new Error(
						`Source leakage between ${priorSource} and ${splitName}`,
					);
				}
				seenSources.set(sourceId, splitName);
			}
			const question = example.messages?.find(
				(message) => message.role === "user",
			)?.content;
			const answer = example.messages?.find(
				(message) => message.role === "assistant",
			)?.content;
			for (const [kind, value, registry] of [
				["question", question, seenQuestions],
				["answer", answer, seenAnswers],
			] as const) {
				if (!value) {
					continue;
				}
				const normalized = normalize(value);
				const priorSplit = registry.get(normalized);
				if (priorSplit && priorSplit !== splitName) {
					throw new Error(
						`Normalized ${kind} leakage between ${priorSplit} and ${splitName}`,
					);
				}
				registry.set(normalized, splitName);
			}
		}
	}
}
