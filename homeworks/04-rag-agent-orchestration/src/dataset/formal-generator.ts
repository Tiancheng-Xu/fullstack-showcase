import { createHash } from "node:crypto";
import { z } from "zod";
import type { CoverageCell, CoverageInteraction } from "./draft.js";
import { MessageSchema, type SftExample, SftExampleSchema } from "./schema.js";

export type FormalDraftSource = Readonly<{
	relativePath: string;
	contentSha256: string;
}>;

const FormalDraftResponseSchema = z.object({
	messages: z.array(MessageSchema).min(2).max(4),
});

export type FormalDraftResponse = z.infer<typeof FormalDraftResponseSchema>;

function unwrapJsonFence(content: string): string {
	const trimmed = content.trim();
	const fenced = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/iu);
	return fenced?.[1]?.trim() ?? trimmed;
}

export function parseFormalDraftResponse(
	content: string,
	interaction: CoverageInteraction,
): FormalDraftResponse {
	const parsed = FormalDraftResponseSchema.parse(
		JSON.parse(unwrapJsonFence(content)),
	);
	const expectedLength = interaction === "multi-turn" ? 4 : 2;
	if (parsed.messages.length !== expectedLength) {
		throw new Error(
			`${interaction} draft requires exactly ${expectedLength} messages`,
		);
	}
	for (const [index, message] of parsed.messages.entries()) {
		const expectedRole = index % 2 === 0 ? "user" : "assistant";
		if (message.role !== expectedRole) {
			throw new Error(`Formal draft message ${index} must use ${expectedRole}`);
		}
	}
	return parsed;
}

export function selectFormalDraftSource(
	cell: CoverageCell,
	documents: readonly FormalDraftSource[],
): FormalDraftSource {
	const uniqueByHash = new Map<string, FormalDraftSource>();
	for (const document of documents) {
		if (document.relativePath.split("/")[0] !== cell.sourceGroup) {
			continue;
		}
		const current = uniqueByHash.get(document.contentSha256);
		if (
			!current ||
			document.relativePath.localeCompare(current.relativePath) < 0
		) {
			uniqueByHash.set(document.contentSha256, document);
		}
	}
	const candidates = [...uniqueByHash.values()].sort((left, right) =>
		left.relativePath.localeCompare(right.relativePath),
	);
	if (candidates.length === 0) {
		throw new Error(`No unique source document for ${cell.sourceGroup}`);
	}
	const digest = createHash("sha256")
		.update(`${cell.id}:${cell.sourceGroup}`)
		.digest("hex");
	const index = Number.parseInt(digest.slice(0, 8), 16) % candidates.length;
	return candidates[index] as FormalDraftSource;
}

export function buildFormalExample(
	cell: CoverageCell,
	source: FormalDraftSource,
	response: FormalDraftResponse,
): SftExample {
	const idNumber = cell.id.match(/^agenda-(\d+)$/u)?.[1];
	if (!idNumber) {
		throw new Error(`Invalid coverage cell ID: ${cell.id}`);
	}
	return SftExampleSchema.parse({
		id: `formal-${idNumber}`,
		sourceIds: [`sha256:${source.contentSha256}`],
		capability: cell.capability,
		topic: cell.topic,
		messages: [
			{
				role: "system",
				content:
					"你是一灯 Agent：先给结论，用大白话解释，并说明关键边界与可验证步骤。",
			},
			...response.messages,
		],
		provenance: {
			sourceKind: "course-derived",
			sourceGroup: cell.sourceGroup,
		},
		review: { status: "draft", rubricVersion: 2 },
	});
}
