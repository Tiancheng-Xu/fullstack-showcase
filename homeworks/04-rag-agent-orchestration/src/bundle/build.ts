import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	copyFile,
	lstat,
	mkdir,
	mkdtemp,
	readFile,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DatasetReleaseSchema } from "../dataset/release.js";
import { validateForExport } from "../dataset/review.js";
import {
	ALLOWED_BUNDLE_ENTRIES,
	assertBundleEntries,
	verifyBundle,
} from "./verify.js";

type FileEvidence = Readonly<{ bytes: number; sha256: string }>;

function evidence(bytes: Buffer): FileEvidence {
	return {
		bytes: bytes.byteLength,
		sha256: createHash("sha256").update(bytes).digest("hex"),
	};
}

async function copyRegularFile(
	source: string,
	destination: string,
): Promise<void> {
	const metadata = await lstat(source);
	if (!metadata.isFile() || metadata.isSymbolicLink()) {
		throw new Error(`Bundle source must be a regular file: ${source}`);
	}
	await mkdir(path.dirname(destination), { recursive: true });
	await copyFile(source, destination);
}

async function writeTrainingSplit(
	source: string,
	destination: string,
): Promise<Readonly<{ ids: readonly string[]; file: FileEvidence }>> {
	const reviewedRows = (await readFile(source, "utf8"))
		.trim()
		.split(/\r?\n/u)
		.filter(Boolean)
		.map((line) => JSON.parse(line));
	const rows = reviewedRows.map((row) => validateForExport(row));
	const bytes = Buffer.from(
		`${rows.map((row) => JSON.stringify(row)).join("\n")}\n`,
		"utf8",
	);
	await mkdir(path.dirname(destination), { recursive: true });
	await writeFile(destination, bytes);
	return {
		ids: reviewedRows.map((row) => String(row.id)),
		file: evidence(bytes),
	};
}

async function main(): Promise<void> {
	const homeworkRoot = fileURLToPath(new URL("../../", import.meta.url));
	const staging = await mkdtemp(path.join(tmpdir(), "qwen3-smoke-upload-"));
	const trainingEntries = [
		"training/pyproject.toml",
		"training/preflight.py",
		"training/verify_dataset.py",
		"training/evaluate.py",
		"training/collect_artifacts.py",
		"training/configs/qwen3-8b-smoke.yaml",
		"training/configs/qwen3-8b-incremental.yaml",
	] as const;
	for (const entry of trainingEntries) {
		await copyRegularFile(
			path.join(homeworkRoot, entry),
			path.join(staging, entry),
		);
	}
	await copyRegularFile(
		path.join(homeworkRoot, "training/dataset_info.json"),
		path.join(staging, "data/dataset_info.json"),
	);
	const splitResults: Record<
		"train" | "validation" | "test",
		Readonly<{ ids: readonly string[]; file: FileEvidence }>
	> = {} as Record<
		"train" | "validation" | "test",
		Readonly<{ ids: readonly string[]; file: FileEvidence }>
	>;
	for (const name of ["train", "validation", "test"] as const) {
		splitResults[name] = await writeTrainingSplit(
			path.join(homeworkRoot, `data/private/${name}.jsonl`),
			path.join(staging, `data/${name}.jsonl`),
		);
	}
	const release = DatasetReleaseSchema.parse({
		schemaVersion: 1,
		releaseId: process.env.RAG_RELEASE_ID ?? "rag-sft-20260802-v1",
		createdAt: process.env.RAG_RELEASE_CREATED_AT ?? "2026-08-02T16:30:00.000Z",
		baseModel: "Qwen/Qwen3-8B",
		parent: null,
		composition: {
			newExampleIds: Object.values(splitResults)
				.flatMap((result) => result.ids)
				.sort(),
			replayExampleIds: [],
		},
		splits: Object.fromEntries(
			Object.entries(splitResults).map(([name, result]) => [
				name,
				{ rows: result.ids.length, sha256: result.file.sha256 },
			]),
		),
	});
	await writeFile(
		path.join(staging, "data/release.json"),
		`${JSON.stringify(release, null, 2)}\n`,
		"utf8",
	);
	execFileSync("python3", ["training/verify_dataset.py", "data"], {
		cwd: staging,
		stdio: "pipe",
	});

	const payloadEntries = [...ALLOWED_BUNDLE_ENTRIES]
		.filter((entry) => entry !== "MANIFEST.json")
		.sort();
	assertBundleEntries(payloadEntries);
	const files: Record<string, FileEvidence> = {};
	for (const entry of payloadEntries) {
		files[entry] = evidence(await readFile(path.join(staging, entry)));
	}
	await writeFile(
		path.join(staging, "MANIFEST.json"),
		`${JSON.stringify({ version: 1, files }, null, 2)}\n`,
		"utf8",
	);

	const outputDirectory = path.join(homeworkRoot, "artifacts/private");
	await mkdir(outputDirectory, { recursive: true });
	const zipPath = path.join(outputDirectory, "qwen3-smoke-upload.zip");
	execFileSync("zip", ["-q", zipPath, ...[...ALLOWED_BUNDLE_ENTRIES].sort()], {
		cwd: staging,
	});
	const verified = verifyBundle(zipPath);
	await writeFile(
		path.join(outputDirectory, "qwen3-smoke-upload.manifest.json"),
		`${JSON.stringify({ bundle: evidence(await readFile(zipPath)), payload: files }, null, 2)}\n`,
		"utf8",
	);
	process.stdout.write(`${JSON.stringify({ zipPath, ...verified })}\n`);
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	await main();
}
