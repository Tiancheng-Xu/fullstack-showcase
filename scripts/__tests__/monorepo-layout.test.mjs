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

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

test("keeps Saturday and Sunday Web3 homework isolated", async () => {
	for (const required of [
		"homeworks/05-web3-remix/contracts/SimpleBank.sol",
		"homeworks/05-web3-remix/contracts/RedPacket.sol",
		"homeworks/05-web3-remix/README.md",
		"docs/qa/web3-saturday-contracts.md",
	]) {
		assert.equal(await exists(required), true, `${required} must exist`);
	}
	assert.equal(await exists("apps/web/src/features/web3"), false);
});

test("registers the isolated Sunday Web3 workspace and protects local secrets", async () => {
	const [workspace, rootPackageText] = await Promise.all([
		readFile(path.join(root, "pnpm-workspace.yaml"), "utf8"),
		readFile(path.join(root, "package.json"), "utf8"),
	]);
	const rootPackage = JSON.parse(rootPackageText);

	assert.match(workspace, /homeworks\/\*\/\*/);
	for (const script of [
		"web3:check",
		"web3:test",
		"web3:typecheck",
		"web3:build",
	]) {
		assert.equal(typeof rootPackage.scripts[script], "string");
	}
	for (const localPath of [
		"homeworks/06-web3-dapp/contracts/.hardhat-keystore.json",
		"homeworks/06-web3-dapp/contracts/cache",
		"homeworks/06-web3-dapp/contracts/ignition/deployments",
		"homeworks/06-web3-dapp/web/.env.local",
	]) {
		assert.equal(
			await isIgnored(localPath),
			true,
			`${localPath} must be ignored`,
		);
	}
});

test("documents and protects the complete Sunday Web3 implementation", async () => {
	for (const required of [
		"homeworks/06-web3-dapp/web/src/features/growth/useGrowth.ts",
		"homeworks/06-web3-dapp/web/src/components/StarBuddy.tsx",
		"homeworks/06-web3-dapp/web/src/features/growth/usePointTransfer.ts",
		"homeworks/06-web3-dapp/web/src/features/growth/PointTransferPanel.tsx",
		"docs/qa/web3-onchain-notebook.md",
	]) {
		assert.equal(await exists(required), true, `${required} must exist`);
	}

	const readme = await readFile(
		path.join(root, "homeworks/06-web3-dapp/README.md"),
		"utf8",
	);
	for (const fragment of [
		"UTC+8",
		"Meal",
		"Walk",
		"Read",
		"SEPOLIARPCURL",
		"SEPOLIAPRIVATEKEY",
		"ETHERSCANAPIKEY",
		"VITE_ONCHAIN_NOTEBOOK_ADDRESS",
		"web3:check",
		"web3:test",
		"web3:typecheck",
		"web3:build",
		"deploy:sepolia",
		"deploy:verify:sepolia",
		"累计成长值",
		"可转余额",
		"transferGrowthPoints",
		"不可兑换",
		"receipt",
	]) {
		assert.match(readme, new RegExp(escapeRegExp(fragment)));
	}
	assert.doesNotMatch(readme, /(?<!不)是\s*(?:ERC-20|ERC20)/i);
	assert.doesNotMatch(readme, /已(?:经)?部署.{0,20}(?:主网|mainnet)/i);

	const { stdout } = await execFile(
		"git",
		["ls-files", "-z", "--", "homeworks/06-web3-dapp"],
		{ cwd: root, encoding: "utf8" },
	);
	const trackedFiles = stdout.split("\0").filter(Boolean);
	for (const relativePath of trackedFiles) {
		const content = await readFile(path.join(root, relativePath), "utf8");
		const contentWithoutPublicSepoliaTransactions = content.replaceAll(
			/https:\/\/sepolia\.etherscan\.io\/tx\/0x[0-9a-fA-F]{64}/g,
			"https://sepolia.etherscan.io/tx/PUBLIC_TRANSACTION_HASH",
		);
		assert.doesNotMatch(
			contentWithoutPublicSepoliaTransactions,
			/0x[0-9a-fA-F]{64}/,
			`${relativePath} must not contain a private-key-like value`,
		);
		assert.doesNotMatch(
			content,
			/(?:mnemonic|助记词)\s*[:=]\s*[^\s`]+/i,
			`${relativePath} must not contain a mnemonic value`,
		);
		assert.doesNotMatch(
			content,
			/VITE_[A-Z0-9_]*(?:SECRET|PRIVATE|KEY|TOKEN)[A-Z0-9_]*/,
			`${relativePath} must not define a client-side secret variable`,
		);
	}
});

test("publishes BabySteps through GitHub Pages with the repository base path", async () => {
	const workflowPath = ".github/workflows/babysteps-pages.yml";
	assert.equal(await exists(workflowPath), true, `${workflowPath} must exist`);

	const [workflow, viteConfig] = await Promise.all([
		readFile(path.join(root, workflowPath), "utf8"),
		readFile(
			path.join(root, "homeworks/06-web3-dapp/web/vite.config.ts"),
			"utf8",
		),
	]);

	for (const fragment of [
		"codex/web3-onchain-notebook",
		"actions/configure-pages@v5",
		"actions/upload-pages-artifact@v4",
		"actions/deploy-pages@v4",
		"homeworks/06-web3-dapp/web/dist",
		"VITE_ONCHAIN_NOTEBOOK_ADDRESS",
		"VITE_BASE_PATH: /fullstack-showcase/",
	]) {
		assert.match(workflow, new RegExp(escapeRegExp(fragment)));
	}
	assert.match(viteConfig, /VITE_BASE_PATH/);
	assert.doesNotMatch(workflow, /(?:PRIVATE_KEY|MNEMONIC|助记词)/i);
});
