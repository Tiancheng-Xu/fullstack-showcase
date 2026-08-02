export type HashDocument = Readonly<{
	relativePath: string;
	contentSha256: string;
}>;

export type DeduplicationResult = Readonly<{
	canonicalPaths: readonly string[];
	duplicates: readonly Readonly<{
		canonicalPath: string;
		duplicatePath: string;
	}>[];
}>;

export function deduplicateByHash(
	documents: readonly HashDocument[],
): DeduplicationResult {
	const groups = new Map<string, string[]>();
	for (const document of documents) {
		const paths = groups.get(document.contentSha256) ?? [];
		paths.push(document.relativePath);
		groups.set(document.contentSha256, paths);
	}

	const canonicalPaths: string[] = [];
	const duplicates: { canonicalPath: string; duplicatePath: string }[] = [];
	for (const paths of groups.values()) {
		paths.sort((left, right) => left.localeCompare(right));
		const [canonicalPath, ...duplicatePaths] = paths;
		if (!canonicalPath) {
			continue;
		}
		canonicalPaths.push(canonicalPath);
		for (const duplicatePath of duplicatePaths) {
			duplicates.push({ canonicalPath, duplicatePath });
		}
	}

	canonicalPaths.sort((left, right) => left.localeCompare(right));
	duplicates.sort(
		(left, right) =>
			left.canonicalPath.localeCompare(right.canonicalPath) ||
			left.duplicatePath.localeCompare(right.duplicatePath),
	);
	return { canonicalPaths, duplicates };
}
