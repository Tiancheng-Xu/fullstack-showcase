import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { discoverMarkdown } from "./discover.js";
import type { SourceDocument } from "./types.js";

type ManifestBoundaries = Readonly<{
	sourceRoot: string;
	homeworkRoot: string;
}>;

function isInside(root: string, candidate: string): boolean {
	const relative = path.relative(path.resolve(root), path.resolve(candidate));
	return (
		relative === "" ||
		(!relative.startsWith("..") && !path.isAbsolute(relative))
	);
}

export function resolveManifestDestination(
	input: string,
	repositoryRoot: string,
): string {
	return path.isAbsolute(input)
		? path.normalize(input)
		: path.resolve(repositoryRoot, input);
}

export async function writeManifest(
	documents: readonly SourceDocument[],
	destination: string,
	boundaries: ManifestBoundaries,
): Promise<void> {
	if (isInside(boundaries.sourceRoot, destination)) {
		throw new Error("Manifest destination must not be inside the source root");
	}
	if (!isInside(boundaries.homeworkRoot, destination)) {
		throw new Error("Manifest destination must be inside the homework root");
	}

	const safeDocuments = documents.map(
		({ absolutePath: _absolutePath, ...metadata }) => metadata,
	);
	await mkdir(path.dirname(destination), { recursive: true });
	await writeFile(
		destination,
		`${JSON.stringify({ version: 1, documentCount: safeDocuments.length, documents: safeDocuments }, null, 2)}\n`,
		"utf8",
	);
}

async function main(): Promise<void> {
	const sourceRoot = process.env.RAG_SOURCE_ROOT;
	const destination = process.env.RAG_MANIFEST_PATH;
	if (!sourceRoot || !destination) {
		throw new Error("RAG_SOURCE_ROOT and RAG_MANIFEST_PATH are required");
	}
	const homeworkRoot = fileURLToPath(new URL("../../", import.meta.url));
	const repositoryRoot = fileURLToPath(
		new URL("../../../../", import.meta.url),
	);
	const documents = await discoverMarkdown({
		root: sourceRoot,
		excludedDirectoryNames: new Set([
			".git",
			"node_modules",
			".archive",
			"tmp",
		]),
	});
	const resolvedDestination = resolveManifestDestination(
		destination,
		repositoryRoot,
	);
	await writeManifest(documents, resolvedDestination, {
		sourceRoot,
		homeworkRoot,
	});
	process.stdout.write(
		`${JSON.stringify({ documentCount: documents.length, destination })}\n`,
	);
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	await main();
}
