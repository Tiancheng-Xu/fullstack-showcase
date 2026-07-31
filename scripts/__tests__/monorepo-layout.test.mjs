import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const root = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../..",
);
const execFile = promisify(execFileCallback);

async function exists(relativePath) {
	try {
		await access(path.join(root, relativePath));
		return true;
	} catch {
		return false;
	}
}

async function findNamed(directory, target) {
	const matches = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		if (
			[
				".git",
				".superpowers",
				".tc-flow",
				".tc-worktrees",
				"node_modules",
			].includes(entry.name)
		) {
			continue;
		}
		const absolute = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			matches.push(...(await findNamed(absolute, target)));
		} else if (entry.name === target) {
			matches.push(path.relative(root, absolute));
		}
	}
	return matches;
}

async function isIgnored(relativePath) {
	try {
		await execFile(
			"git",
			["check-ignore", "--quiet", "--no-index", relativePath],
			{
				cwd: root,
			},
		);
		return true;
	} catch (error) {
		if (error.code === 1) {
			return false;
		}
		throw error;
	}
}

async function isTracked(relativePath) {
	try {
		await execFile("git", ["ls-files", "--error-unmatch", "--", relativePath], {
			cwd: root,
		});
		return true;
	} catch (error) {
		if (error.code === 1) {
			return false;
		}
		throw error;
	}
}

test("uses one root workspace and lockfile", async () => {
	assert.deepEqual(await findNamed(root, "pnpm-workspace.yaml"), [
		"pnpm-workspace.yaml",
	]);
	assert.deepEqual(await findNamed(root, "pnpm-lock.yaml"), ["pnpm-lock.yaml"]);
});

test("places the application and shared packages at root boundaries", async () => {
	for (const required of [
		"apps/web/package.json",
		"apps/web/src/main.tsx",
		"packages/ui/package.json",
		"packages/env/package.json",
		"packages/config/package.json",
		"apps/api/README.md",
	]) {
		assert.equal(await exists(required), true, `${required} must exist`);
	}

	assert.equal(await exists("apps/web/apps"), false);
	assert.equal(await exists("apps/web/packages"), false);
	assert.equal(await exists("apps/api/package.json"), true);
});

test("ignores generated and local application files", async () => {
	for (const localPath of [
		"apps/web/src/routeTree.gen.ts",
		"apps/web/.dev.vars.local",
		"apps/web/.wrangler/state",
	]) {
		assert.equal(
			await isIgnored(localPath),
			true,
			`${localPath} must be ignored`,
		);
	}

	assert.equal(
		await isTracked("apps/web/src/routeTree.gen.ts"),
		false,
		"apps/web/src/routeTree.gen.ts must not be tracked",
	);
});

test("documents the flattened learner workflow", async () => {
	const readme = await readFile(path.join(root, "apps/web/README.md"), "utf8");

	for (const fragment of [
		"apps/web",
		"apps/api",
		"packages/ui",
		"pnpm dev",
		"pnpm test",
		"pnpm typecheck",
		"pnpm build",
	]) {
		assert.match(readme, new RegExp(fragment.replace("/", "\\/")));
	}

	assert.match(readme, /Root scripts select the `apps\/web` workspace\./);
	assert.match(readme, /Cloudflare deploys `apps\/web\/dist`\./);

	assert.doesNotMatch(readme, /apps\/web\/apps\/web|pnpm --dir apps\/web/);
});

test("keeps active preview and application documentation on the flattened layout", async () => {
	const appsReadme = await readFile(path.join(root, "apps/README.md"), "utf8");
	const previewDesign = await readFile(
		path.join(
			root,
			"docs/superpowers/specs/2026-07-29-cloudflare-pr-preview-design.md",
		),
		"utf8",
	);
	const designLink = await readFile(
		path.join(root, "specs/cloudflare-pr-preview/design.md"),
		"utf8",
	);

	assert.match(appsReadme, /apps\/api.*documentation-only/is);
	assert.match(previewDesign, /pnpm install --frozen-lockfile/);
	assert.match(previewDesign, /apps\/web\/dist/);
	assert.match(
		designLink,
		/docs\/superpowers\/specs\/2026-07-29-cloudflare-pr-preview-design\.md/,
	);

	for (const document of [appsReadme, previewDesign, designLink]) {
		assert.doesNotMatch(
			document,
			/apps\/web\/apps\/web|apps\/web\/packages|apps\/web\/pnpm-lock\.yaml|pnpm --dir apps\/web|nested Better-T-Stack workspace/i,
		);
	}
});

test("records the learning-notes working agreement", async () => {
	const agreement = await readFile(path.join(root, "AGENTS.md"), "utf8");
	assert.match(agreement, /\/Users\/shier\/Desktop\/一灯学习笔记/);
	assert.match(agreement, /when\s+that path is available/i);
	assert.match(
		agreement,
		/otherwise.*repository-local requirements and designs/is,
	);
	assert.match(agreement, /record.*notes were unavailable/is);
	assert.match(
		agreement,
		/verified project constraints and tests take precedence/i,
	);
	assert.match(agreement, /do not copy/i);
	assert.match(agreement, /isolated feature worktree for multi-file changes/i);
	assert.match(
		agreement,
		/keep frontend and backend build scopes independent/i,
	);
	assert.match(
		agreement,
		/do not commit credentials, local Cloudflare state, or private photographs/i,
	);
	assert.match(
		agreement,
		/do not trigger production deployment without explicit authorization/i,
	);
});
