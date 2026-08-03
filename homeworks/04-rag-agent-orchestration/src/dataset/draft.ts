import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { z } from "zod";
import { type SftExample, SftExampleSchema } from "./schema.js";

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
	const limit = parseLimit(process.argv.slice(2));
	const perSource = parsePerSource(process.argv.slice(2));
	const sourceRoot = process.env.RAG_SOURCE_ROOT;
	if (!sourceRoot) {
		throw new Error("RAG_SOURCE_ROOT is required");
	}
	const homeworkRoot = fileURLToPath(new URL("../../", import.meta.url));
	const manifest = ManifestSchema.parse(
		JSON.parse(
			await readFile(
				path.join(homeworkRoot, "data/private/corpus-manifest.json"),
				"utf8",
			),
		),
	);
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
