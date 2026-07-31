import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../..",
);
const scanRoots = ["apps", "packages", "scripts"];
const textExtensions = new Set([
	".cjs",
	".css",
	".env",
	".example",
	".html",
	".js",
	".json",
	".jsx",
	".mjs",
	".ts",
	".tsx",
	".yaml",
	".yml",
]);

async function collectFiles(directory) {
	const files = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		if (["dist", "node_modules", "coverage"].includes(entry.name)) {
			continue;
		}

		const absolute = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await collectFiles(absolute)));
		} else if (textExtensions.has(path.extname(entry.name))) {
			files.push(absolute);
		}
	}
	return files;
}

test("GitHub profile API package exists", async () => {
	await assert.doesNotReject(access(path.join(root, "apps/api/package.json")));
});

test("source and config files contain no GitHub token channel", async () => {
	const forbidden = [
		["github", "pat", ""].join("_"),
		["GITHUB", "TOKEN="].join("_"),
		["VITE", "GITHUB", "TOKEN"].join("_"),
	];
	const files = (
		await Promise.all(
			scanRoots.map((entry) => collectFiles(path.join(root, entry))),
		)
	).flat();
	const violations = [];

	for (const file of files) {
		const contents = await readFile(file, "utf8");
		for (const marker of forbidden) {
			if (contents.includes(marker)) {
				violations.push(`${path.relative(root, file)} contains ${marker}`);
			}
		}
	}

	assert.deepEqual(violations, []);
});

test("root commands orchestrate the complete local homework", async () => {
	const packageJson = JSON.parse(
		await readFile(path.join(root, "package.json"), "utf8"),
	);
	const { scripts } = packageJson;

	assert.match(scripts.dev, /@course-homework\/api.*db:migrate/);
	assert.match(scripts.dev, /--parallel/);
	assert.match(scripts.dev, /@course-homework\/api/);
	assert.match(scripts.dev, /@course-homework\/web/);
	for (const command of ["test", "typecheck", "build"]) {
		assert.match(scripts[command], /@course-homework\/api/);
		assert.match(scripts[command], /@course-homework\/web/);
	}
	assert.match(scripts.check, /apps\/api\/src/);
	assert.match(scripts.check, /apps\/web\/src\/features\/github-profile/);
});
