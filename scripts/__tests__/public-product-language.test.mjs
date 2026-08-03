import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

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
