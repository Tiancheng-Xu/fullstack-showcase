import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const repositoryRoot = new URL("../../", import.meta.url);
const publicSourceRoots = [
	new URL("apps/web/src/", repositoryRoot),
	new URL("homeworks/06-web3-dapp/web/src/", repositoryRoot),
];

async function sourceFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const nested = await Promise.all(
		entries.map(async (entry) => {
			const url = new URL(
				`${entry.name}${entry.isDirectory() ? "/" : ""}`,
				directory,
			);
			if (entry.isDirectory()) return sourceFiles(url);
			if (!entry.name.endsWith(".tsx") || entry.name.includes(".test.")) {
				return [];
			}
			return [url];
		}),
	);
	return nested.flat();
}

const canonicalPath = new URL(
	"../../apps/web/src/routes/projects.github-profile.tsx",
	import.meta.url,
);
const legacyPath = new URL(
	"../../apps/web/src/routes/homework.github-profile.tsx",
	import.meta.url,
);

test("GitHub Profile has a product route and a legacy redirect", async () => {
	const canonical = await readFile(canonicalPath, "utf8");
	const legacy = await readFile(legacyPath, "utf8");

	assert.match(canonical, /createFileRoute\("\/projects\/github-profile"\)/);
	assert.match(canonical, /component:\s*GitHubProfileContent/);
	assert.match(legacy, /redirect\(\{/);
	assert.match(legacy, /to:\s*"\/projects\/github-profile"/);
	assert.match(legacy, /replace:\s*true/);
	assert.doesNotMatch(legacy, /component:\s*GitHubProfileContent/);
});

test("public frontend literals do not present projects as coursework", async () => {
	const files = (await Promise.all(publicSourceRoots.map(sourceFiles))).flat();
	for (const file of files) {
		const source = await readFile(file, "utf8");
		assert.doesNotMatch(source, /作业|课程|老师|验收/, file.pathname);
	}
});
