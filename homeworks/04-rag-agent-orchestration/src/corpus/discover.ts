import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { CorpusOptions, SourceDocument } from "./types.js";

async function visitDirectory(
	root: string,
	directory: string,
	excludedDirectoryNames: ReadonlySet<string>,
	documents: SourceDocument[],
): Promise<void> {
	const entries = await readdir(directory, { withFileTypes: true });
	entries.sort((left, right) => left.name.localeCompare(right.name));

	for (const entry of entries) {
		const absolutePath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			if (!excludedDirectoryNames.has(entry.name)) {
				await visitDirectory(root, absolutePath, excludedDirectoryNames, documents);
			}
			continue;
		}
		if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== ".md") {
			continue;
		}

		const bytes = await readFile(absolutePath);
		const metadata = await stat(absolutePath);
		documents.push({
			absolutePath,
			relativePath: path.relative(root, absolutePath).split(path.sep).join("/"),
			byteLength: bytes.byteLength,
			modifiedAt: metadata.mtime.toISOString(),
			contentSha256: createHash("sha256").update(bytes).digest("hex"),
		});
	}
}

export async function discoverMarkdown(options: CorpusOptions): Promise<readonly SourceDocument[]> {
	const root = path.resolve(options.root);
	const documents: SourceDocument[] = [];
	await visitDirectory(root, root, options.excludedDirectoryNames, documents);
	return documents.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}
