import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseDocument } from "yaml";

const defaultWorkflowPath = fileURLToPath(
	new URL("../.github/workflows/cloudflare-preview.yml", import.meta.url),
);
const workflowPath = process.argv[2]
	? path.resolve(process.argv[2])
	: defaultWorkflowPath;
const githubExpressionPrefix = "$" + "{{ ";
const githubApiToken = `${githubExpressionPrefix}secrets.CLOUDFLARE_API_TOKEN }}`;
const githubAccountId = `${githubExpressionPrefix}secrets.CLOUDFLARE_ACCOUNT_ID }}`;
const githubPagesProject = `--project-name=${githubExpressionPrefix}vars.CLOUDFLARE_PAGES_PROJECT }}`;
const githubToken = `${githubExpressionPrefix}secrets.GITHUB_TOKEN }}`;

function hasOwn(object, key) {
	return Object.hasOwn(object ?? {}, key);
}

function validateWorkflow(workflow) {
	const errors = [];
	const triggers = workflow?.on;
	const pullRequestTypes = triggers?.pull_request?.types;
	const preview = workflow?.jobs?.preview;
	const steps = Array.isArray(preview?.steps) ? preview.steps : [];
	const findAction = (action) => steps.find((step) => step?.uses === action);
	const hasRun = (command) => steps.some((step) => step?.run === command);
	const deploy = findAction("cloudflare/wrangler-action@v3");
	const deployCommand = deploy?.with?.command;

	if (
		!Array.isArray(pullRequestTypes) ||
		!["opened", "reopened", "synchronize"].every((event) =>
			pullRequestTypes.includes(event),
		)
	) {
		errors.push("on.pull_request.types");
	}
	if (!hasOwn(triggers, "workflow_dispatch")) {
		errors.push("on.workflow_dispatch");
	}
	if (workflow?.permissions?.contents !== "read") {
		errors.push("permissions.contents");
	}
	if (workflow?.permissions?.deployments !== "write") {
		errors.push("permissions.deployments");
	}
	if (
		typeof preview?.if !== "string" ||
		!preview.if.includes(
			"github.event.pull_request.head.repo.full_name == github.repository",
		)
	) {
		errors.push("jobs.preview.if");
	}
	if (preview?.["runs-on"] !== "ubuntu-latest") {
		errors.push("jobs.preview.runs-on");
	}
	if (preview?.environment?.name !== "cloudflare-preview") {
		errors.push("jobs.preview.environment.name");
	}
	if (
		preview?.environment?.url !==
		"https://course-homework-preview.pages.dev"
	) {
		errors.push("jobs.preview.environment.url");
	}

	const pnpmSetup = findAction("pnpm/action-setup@v4");
	if (pnpmSetup?.with?.version !== "11.17.0") {
		errors.push("pnpm/action-setup version 11.17.0");
	}

	const nodeSetup = findAction("actions/setup-node@v4");
	if (nodeSetup?.with?.["node-version"] !== 22) {
		errors.push("actions/setup-node node-version 22");
	}
	if (nodeSetup?.with?.cache !== "pnpm") {
		errors.push("actions/setup-node cache pnpm");
	}
	if (nodeSetup?.with?.["cache-dependency-path"] !== "pnpm-lock.yaml") {
		errors.push("cache-dependency-path pnpm-lock.yaml");
	}

	for (const command of [
		"pnpm install --frozen-lockfile",
		"pnpm test",
		"pnpm typecheck",
		"pnpm build",
	]) {
		if (!hasRun(command)) {
			errors.push(command);
		}
	}

	if (deploy?.with?.apiToken !== githubApiToken) {
		errors.push("CLOUDFLARE_API_TOKEN");
	}
	if (deploy?.with?.accountId !== githubAccountId) {
		errors.push("CLOUDFLARE_ACCOUNT_ID");
	}
	if (deploy?.with?.packageManager !== "pnpm") {
		errors.push("wrangler packageManager pnpm");
	}
	if (deploy?.with?.wranglerVersion !== "4.115.0") {
		errors.push("wranglerVersion 4.115.0");
	}
	for (const fragment of [
		"pages deploy apps/web/dist",
		githubPagesProject,
		"--branch=preview",
		"--commit-dirty=true",
	]) {
		if (typeof deployCommand !== "string" || !deployCommand.includes(fragment)) {
			errors.push(fragment);
		}
	}
	if (deploy?.with?.gitHubToken !== githubToken) {
		errors.push("GITHUB_TOKEN");
	}

	return errors;
}

try {
	const source = await readFile(workflowPath, "utf8");
	const document = parseDocument(source);
	if (document.errors.length > 0) {
		throw new Error(document.errors.map((error) => error.message).join("; "));
	}

	const errors = validateWorkflow(document.toJS());
	if (errors.length > 0) {
		console.error(`Workflow validation failed. Missing or invalid: ${errors.join(", ")}`);
		process.exitCode = 1;
	} else {
		console.log("Cloudflare preview workflow validation passed.");
	}
} catch (error) {
	console.error(`Cloudflare preview workflow has invalid YAML: ${error.message}`);
	process.exitCode = 1;
}
