import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { discoverMarkdown } from "../src/corpus/discover.js";
import { writeManifest } from "../src/corpus/manifest.js";

describe("discoverMarkdown", () => {
	it("returns Markdown metadata without writing to the source", async () => {
		const root = await mkdtemp(path.join(tmpdir(), "rag-source-"));
		await writeFile(path.join(root, "lesson.md"), "# Lesson\nBody", "utf8");
		await mkdir(path.join(root, ".git"));
		await writeFile(path.join(root, ".git", "ignored.md"), "ignore", "utf8");
		const before = await readFile(path.join(root, "lesson.md"), "utf8");

		const result = await discoverMarkdown({
			root,
			excludedDirectoryNames: new Set([".git", "node_modules", ".archive", "tmp"]),
		});

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ relativePath: "lesson.md", byteLength: 13 });
		expect(result[0]?.contentSha256).toMatch(/^[a-f0-9]{64}$/);
		expect(await readFile(path.join(root, "lesson.md"), "utf8")).toBe(before);
	});
});

describe("writeManifest", () => {
	it("refuses to write inside the read-only source tree", async () => {
		const sourceRoot = await mkdtemp(path.join(tmpdir(), "rag-source-"));
		const homeworkRoot = await mkdtemp(path.join(tmpdir(), "rag-homework-"));
		await expect(
			writeManifest([], path.join(sourceRoot, "manifest.json"), { sourceRoot, homeworkRoot }),
		).rejects.toThrow(/source root/);
	});
});
