import { readFile } from "node:fs/promises";

const workflowPath = new URL(
	"../.github/workflows/cloudflare-preview.yml",
	import.meta.url,
);

const requiredFragments = [
	"pull_request:",
	"workflow_dispatch:",
	"github.event.pull_request.head.repo.full_name == github.repository",
	"cache-dependency-path: pnpm-lock.yaml",
	"run: pnpm install --frozen-lockfile",
	"pnpm test",
	"pnpm typecheck",
	"pnpm build",
	"cloudflare/wrangler-action@v3",
	"packageManager: npm",
	'wranglerVersion: "4.115.0"',
	"pages deploy apps/web/dist",
	"${{ vars.CLOUDFLARE_PAGES_PROJECT }}",
	"${{ secrets.CLOUDFLARE_API_TOKEN }}",
	"${{ secrets.CLOUDFLARE_ACCOUNT_ID }}",
	"https://course-homework-preview.pages.dev",
];

const forbiddenFragments = [
	"cache-dependency-path: apps/web/pnpm-lock.yaml",
	"pnpm --dir apps/web install --frozen-lockfile",
	"pages deploy apps/web/apps/web/dist",
];

let workflow;

try {
	workflow = await readFile(workflowPath, "utf8");
} catch (error) {
	console.error("Cloudflare preview workflow is missing.");
	process.exitCode = 1;
	throw error;
}

const missing = requiredFragments.filter(
	(fragment) => !workflow.includes(fragment),
);
const forbidden = forbiddenFragments.filter((fragment) => workflow.includes(fragment));

if (missing.length > 0 || forbidden.length > 0) {
	console.error(
		`Workflow validation failed. Missing: ${missing.join(", ")}; Forbidden: ${forbidden.join(", ")}`,
	);
	process.exitCode = 1;
} else {
	console.log("Cloudflare preview workflow validation passed.");
}
