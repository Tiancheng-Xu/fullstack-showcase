import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { z } from "zod";

export const ALLOWED_BUNDLE_ENTRIES = new Set([
	"training/pyproject.toml",
	"training/preflight.py",
	"training/verify_dataset.py",
	"training/evaluate.py",
	"training/collect_artifacts.py",
	"training/configs/qwen3-8b-smoke.yaml",
	"training/configs/qwen3-8b-incremental.yaml",
	"data/dataset_info.json",
	"data/train.jsonl",
	"data/validation.jsonl",
	"data/test.jsonl",
	"data/release.json",
	"MANIFEST.json",
]);

const ManifestSchema = z.object({
	version: z.literal(1),
	files: z.record(
		z.string(),
		z.object({
			bytes: z.number().int().nonnegative(),
			sha256: z.string().regex(/^[a-f0-9]{64}$/),
		}),
	),
});

export function assertBundleEntries(entries: readonly string[]): void {
	for (const entry of entries) {
		const normalized = entry.replaceAll("\\", "/");
		if (
			normalized !== entry ||
			entry.includes("..") ||
			path.isAbsolute(entry)
		) {
			throw new Error(`Bundle entry is outside the allowlist: ${entry}`);
		}
		if (!ALLOWED_BUNDLE_ENTRIES.has(entry)) {
			throw new Error(`Bundle entry is outside the allowlist: ${entry}`);
		}
	}
}

function readZipEntry(zipPath: string, entry: string): Buffer {
	return execFileSync("unzip", ["-p", zipPath, entry], {
		encoding: "buffer",
		maxBuffer: 20 * 1024 * 1024,
	});
}

export function verifyBundle(
	zipPath: string,
): Readonly<{ entries: number; sha256: string }> {
	const listing = execFileSync("unzip", ["-Z1", zipPath], { encoding: "utf8" })
		.trim()
		.split(/\r?\n/u)
		.filter(Boolean);
	assertBundleEntries(listing);
	const expected = [...ALLOWED_BUNDLE_ENTRIES].sort();
	if (JSON.stringify([...listing].sort()) !== JSON.stringify(expected)) {
		throw new Error("Bundle entries do not exactly match the allowlist");
	}
	const manifest = ManifestSchema.parse(
		JSON.parse(readZipEntry(zipPath, "MANIFEST.json").toString("utf8")),
	);
	for (const entry of expected.filter((name) => name !== "MANIFEST.json")) {
		const bytes = readZipEntry(zipPath, entry);
		const expectedFile = manifest.files[entry];
		if (!expectedFile || expectedFile.bytes !== bytes.byteLength) {
			throw new Error(`Bundle byte length mismatch: ${entry}`);
		}
		const digest = createHash("sha256").update(bytes).digest("hex");
		if (digest !== expectedFile.sha256) {
			throw new Error(`Bundle SHA-256 mismatch: ${entry}`);
		}
	}
	const zipBytes = execFileSync("shasum", ["-a", "256", zipPath], {
		encoding: "utf8",
	});
	return {
		entries: listing.length,
		sha256: zipBytes.trim().split(/\s+/u)[0] ?? "",
	};
}

async function main(): Promise<void> {
	const homeworkRoot = fileURLToPath(new URL("../../", import.meta.url));
	const zipPath = path.join(
		homeworkRoot,
		"artifacts/private/qwen3-smoke-upload.zip",
	);
	await readFile(zipPath);
	process.stdout.write(`${JSON.stringify(verifyBundle(zipPath))}\n`);
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	await main();
}
