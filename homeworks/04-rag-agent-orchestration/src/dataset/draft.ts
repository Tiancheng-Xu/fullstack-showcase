import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { z } from "zod";
import {
	type Capability,
	type KnowledgeTopic,
	KnowledgeTopicSchema,
	type SftExample,
	SftExampleSchema,
} from "./schema.js";

const DraftResponseSchema = z.object({
	topic: z.string().min(1),
	user: z.string().min(1).max(2000),
	assistant: z.string().min(1).max(8000),
});

type LegacyDraftTopic =
	| "learn"
	| "interview"
	| "architecture"
	| "execute"
	| "refusal";

const topicAliases = new Map<string, LegacyDraftTopic>([
	["learn", "learn"],
	["学习", "learn"],
	["interview", "interview"],
	["面试", "interview"],
	["architecture", "architecture"],
	["架构", "architecture"],
	["execute", "execute"],
	["执行", "execute"],
	["refusal", "refusal"],
	["拒绝", "refusal"],
]);

export function normalizeDraftTopic(value: string): LegacyDraftTopic {
	return topicAliases.get(value.trim().toLowerCase()) ?? "learn";
}

export function parseDraftResponse(
	content: string,
): z.infer<typeof DraftResponseSchema> {
	const trimmed = content.trim();
	const json =
		trimmed.startsWith("```json\n") && trimmed.endsWith("\n```")
			? trimmed.slice("```json\n".length, -"\n```".length)
			: trimmed;
	return DraftResponseSchema.parse(JSON.parse(json));
}

const ManifestSchema = z.object({
	documents: z.array(
		z.object({
			relativePath: z.string(),
			byteLength: z.number().int().nonnegative(),
			contentSha256: z.string().regex(/^[a-f0-9]{64}$/),
		}),
	),
});

const ChatResponseSchema = z.object({
	choices: z
		.array(z.object({ message: z.object({ content: z.string() }) }))
		.min(1),
});

type DraftSource = z.infer<typeof ManifestSchema>["documents"][number];
type DraftVariant = "concept" | "architecture" | "boundary";
type DraftJob = Readonly<{ source: DraftSource; variant: DraftVariant }>;

export type CoverageInteraction = "single-turn" | "multi-turn" | "boundary";

export type CoverageCell = Readonly<{
	id: string;
	capability: Capability;
	topic: KnowledgeTopic;
	sourceGroup: string;
	interaction: CoverageInteraction;
}>;

export type CoverageAgenda = Readonly<{
	targetTrain: number;
	reservedEvaluation: number;
	reviewPassRate: number;
	alreadyApproved: number;
	requested: number;
	cells: readonly CoverageCell[];
}>;

const capabilitySchedule: readonly Capability[] = [
	...Array.from({ length: 30 }, () => "learn" as const),
	...Array.from({ length: 15 }, () => "interview" as const),
	...Array.from({ length: 15 }, () => "architecture" as const),
	...Array.from({ length: 15 }, () => "execute" as const),
	...Array.from({ length: 10 }, () => "grill-me" as const),
	...Array.from({ length: 5 }, () => "verification" as const),
	...Array.from({ length: 5 }, () => "memory" as const),
	...Array.from({ length: 5 }, () => "safety" as const),
];

export function buildCoverageAgenda(
	options: Readonly<{
		approved: readonly SftExample[];
		sourceGroups: readonly string[];
		sourceGroupWeights?: Readonly<Record<string, number>>;
		targetTrain: number;
	}>,
): CoverageAgenda {
	if (!Number.isInteger(options.targetTrain) || options.targetTrain < 300) {
		throw new Error("Formal targetTrain must be an integer of at least 300");
	}
	const sourceGroups = [
		...new Set(options.sourceGroups.map((group) => group.trim())),
	]
		.filter((group) => group.length > 0)
		.sort();
	if (sourceGroups.length === 0) {
		throw new Error("At least one source group is required");
	}
	const weightedSourceGroups = sourceGroups.flatMap((group) => {
		const configuredWeight = options.sourceGroupWeights?.[group] ?? 1;
		if (!Number.isFinite(configuredWeight) || configuredWeight <= 0) {
			throw new Error(`Source group ${group} must have a positive weight`);
		}
		return Array.from(
			{ length: Math.max(1, Math.round(configuredWeight)) },
			() => group,
		);
	});
	const reservedEvaluation = 40;
	const reviewPassRate = 0.8;
	const requiredCandidates = Math.ceil(
		(options.targetTrain + reservedEvaluation) / reviewPassRate,
	);
	const alreadyApproved = options.approved.filter(
		(example) =>
			example.review.status === "approved" && example.review.rubricVersion >= 2,
	).length;
	const requested = Math.max(0, requiredCandidates - alreadyApproved);
	const cells = Array.from({ length: requested }, (_, index): CoverageCell => {
		const interactionPosition = index % 20;
		const interaction: CoverageInteraction =
			interactionPosition < 4
				? "multi-turn"
				: interactionPosition < 7
					? "boundary"
					: "single-turn";
		return {
			id: `agenda-${String(index + 1).padStart(4, "0")}`,
			capability:
				capabilitySchedule[index % capabilitySchedule.length] ?? "learn",
			topic:
				KnowledgeTopicSchema.options[
					index % KnowledgeTopicSchema.options.length
				] ?? "cross-topic",
			sourceGroup: weightedSourceGroups[
				index % weightedSourceGroups.length
			] as string,
			interaction,
		};
	});
	return {
		targetTrain: options.targetTrain,
		reservedEvaluation,
		reviewPassRate,
		alreadyApproved,
		requested,
		cells,
	};
}

export function chunkCoverageAgenda(
	cells: readonly CoverageCell[],
	batchSize: number,
): readonly (readonly CoverageCell[])[] {
	if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 60) {
		throw new Error("Generation batch size must be an integer from 1 to 60");
	}
	const batches: CoverageCell[][] = [];
	for (let index = 0; index < cells.length; index += batchSize) {
		batches.push(cells.slice(index, index + batchSize));
	}
	return batches;
}

export function deriveFormalSourceGroups(
	documents: readonly Readonly<{ relativePath: string }>[],
): readonly string[] {
	const groups = new Set<string>();
	for (const document of documents) {
		const group = document.relativePath.split("/")[0]?.trim();
		if (
			group &&
			(/^0[3-9]-/u.test(group) || group === "docs" || group === "tc-flow")
		) {
			groups.add(group);
		}
	}
	return [...groups].sort((left, right) => left.localeCompare(right));
}

export async function writeFormalAgenda(
	options: Readonly<{
		documents: readonly Readonly<{
			relativePath: string;
			contentSha256?: string;
		}>[];
		approved: readonly SftExample[];
		targetTrain: number;
		destination: string;
	}>,
): Promise<CoverageAgenda> {
	const sourceGroups = deriveFormalSourceGroups(options.documents);
	const uniqueDocumentsByGroup = new Map<string, Set<string>>();
	for (const document of options.documents) {
		const group = document.relativePath.split("/")[0]?.trim();
		if (!group || !sourceGroups.includes(group)) {
			continue;
		}
		const documents = uniqueDocumentsByGroup.get(group) ?? new Set<string>();
		documents.add(document.contentSha256 ?? document.relativePath);
		uniqueDocumentsByGroup.set(group, documents);
	}
	const sourceGroupWeights = Object.fromEntries(
		sourceGroups.map((group) => [
			group,
			Math.sqrt(uniqueDocumentsByGroup.get(group)?.size ?? 1),
		]),
	);
	const agenda = buildCoverageAgenda({
		approved: options.approved,
		sourceGroups,
		sourceGroupWeights,
		targetTrain: options.targetTrain,
	});
	await writeFile(
		options.destination,
		`${JSON.stringify(agenda, null, 2)}\n`,
		"utf8",
	);
	return agenda;
}

const draftVariants: readonly DraftVariant[] = [
	"concept",
	"architecture",
	"boundary",
];

export function selectDraftSources(
	documents: readonly DraftSource[],
	options: Readonly<{ limit: number; pathPattern?: RegExp }>,
): readonly DraftSource[] {
	const seenHashes = new Set<string>();
	return documents
		.filter(
			(document) => document.byteLength >= 200 && document.byteLength <= 20_000,
		)
		.filter(
			(document) =>
				!options.pathPattern || options.pathPattern.test(document.relativePath),
		)
		.filter((document) => {
			if (seenHashes.has(document.contentSha256)) {
				return false;
			}
			seenHashes.add(document.contentSha256);
			return true;
		})
		.slice(0, options.limit);
}

export function expandDraftJobs(
	sources: readonly DraftSource[],
	perSource: number,
): readonly DraftJob[] {
	if (
		!Number.isInteger(perSource) ||
		perSource < 1 ||
		perSource > draftVariants.length
	) {
		throw new Error("perSource must be an integer from 1 to 3");
	}
	return sources.flatMap((source) =>
		draftVariants.slice(0, perSource).map((variant) => ({ source, variant })),
	);
}

function parseLimit(arguments_: readonly string[]): number {
	const index = arguments_.indexOf("--limit");
	const parsed = index >= 0 ? Number(arguments_[index + 1]) : 10;
	if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
		throw new Error("--limit must be an integer from 1 to 100");
	}
	return parsed;
}

function parsePerSource(arguments_: readonly string[]): number {
	const index = arguments_.indexOf("--per-source");
	const parsed = index >= 0 ? Number(arguments_[index + 1]) : 1;
	if (!Number.isInteger(parsed) || parsed < 1 || parsed > 3) {
		throw new Error("--per-source must be an integer from 1 to 3");
	}
	return parsed;
}

async function requestDraft(
	endpoint: string,
	model: string,
	excerpt: string,
): Promise<z.infer<typeof DraftResponseSchema>> {
	const url = new URL(
		"chat/completions",
		endpoint.endsWith("/") ? endpoint : `${endpoint}/`,
	);
	if (!new Set(["localhost", "127.0.0.1", "::1"]).has(url.hostname)) {
		throw new Error("Draft endpoint must be local");
	}
	const response = await fetch(url, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			model,
			stream: false,
			response_format: { type: "json_object" },
			messages: [
				{
					role: "system",
					content:
						"根据给定课程摘录生成一条中文训练样本。只输出 JSON：topic、user、assistant。不得编造，不得输出个人信息，不得长段照抄。",
				},
				{ role: "user", content: excerpt },
			],
		}),
	});
	if (!response.ok) {
		throw new Error(`Local draft model returned HTTP ${response.status}`);
	}
	const chat = ChatResponseSchema.parse(await response.json());
	return parseDraftResponse(chat.choices[0]?.message.content ?? "");
}

async function main(): Promise<void> {
	const arguments_ = process.argv.slice(2);
	const limit = parseLimit(arguments_);
	const perSource = parsePerSource(arguments_);
	const homeworkRoot = fileURLToPath(new URL("../../", import.meta.url));
	const manifest = ManifestSchema.parse(
		JSON.parse(
			await readFile(
				path.join(homeworkRoot, "data/private/corpus-manifest.json"),
				"utf8",
			),
		),
	);
	if (arguments_.includes("--formal-agenda")) {
		const reviewedPath = path.join(homeworkRoot, "data/private/reviewed.jsonl");
		const approved = (await readFile(reviewedPath, "utf8"))
			.split(/\r?\n/u)
			.filter((line) => line.trim().length > 0)
			.map((line) => SftExampleSchema.parse(JSON.parse(line)));
		const destination = path.resolve(
			homeworkRoot,
			process.env.RAG_FORMAL_AGENDA_PATH ?? "data/private/formal-agenda.json",
		);
		const relativeDestination = path.relative(homeworkRoot, destination);
		if (
			relativeDestination.startsWith("..") ||
			path.isAbsolute(relativeDestination)
		) {
			throw new Error("Formal agenda must stay inside the homework node");
		}
		const agenda = await writeFormalAgenda({
			documents: manifest.documents,
			approved,
			targetTrain: 300,
			destination,
		});
		process.stdout.write(
			`${JSON.stringify({ requested: agenda.requested, sourceGroups: deriveFormalSourceGroups(manifest.documents).length, destination })}\n`,
		);
		return;
	}
	const sourceRoot = process.env.RAG_SOURCE_ROOT;
	if (!sourceRoot) {
		throw new Error("RAG_SOURCE_ROOT is required");
	}
	const pathPattern = process.env.RAG_PATH_PATTERN
		? new RegExp(process.env.RAG_PATH_PATTERN, "iu")
		: undefined;
	const candidates = selectDraftSources(manifest.documents, {
		limit,
		pathPattern,
	});
	const jobs = expandDraftJobs(candidates, perSource);
	const examples: SftExample[] = [];
	for (const [index, job] of jobs.entries()) {
		const source = await readFile(
			path.join(sourceRoot, job.source.relativePath),
			"utf8",
		);
		const draft = await requestDraft(
			process.env.OLLAMA_OPENAI_ENDPOINT ?? "http://localhost:11434/v1/",
			process.env.OLLAMA_MODEL ?? "qwen3:8b",
			`${source.slice(0, 6000)}\n\n训练目标：${job.variant}`,
		);
		examples.push(
			SftExampleSchema.parse({
				id: `draft-${String(index + 1).padStart(3, "0")}`,
				sourceIds: [`sha256:${job.source.contentSha256}`],
				topic: normalizeDraftTopic(draft.topic),
				messages: [
					{
						role: "system",
						content: "基于课程材料回答；区分事实、官方信息和推导。",
					},
					{ role: "user", content: draft.user },
					{ role: "assistant", content: draft.assistant },
				],
				review: { status: "draft" },
			}),
		);
	}
	const destination = path.join(homeworkRoot, "data/private/drafts.jsonl");
	await writeFile(
		destination,
		`${examples.map((example) => JSON.stringify(example)).join("\n")}\n`,
		"utf8",
	);
	process.stdout.write(
		`${JSON.stringify({ drafts: examples.length, destination })}\n`,
	);
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	await main();
}
