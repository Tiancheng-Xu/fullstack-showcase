import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const v8ArticleSlugs = ["sparkplug", "maglev", "leaving-the-sea-of-nodes", "fast-properties", "elements-kinds", "json-stringify", "trash-talk", "pointer-compression", "sandbox"];
const overreactedNotePath = resolve(process.cwd(), "src/features/portfolio/content/overreacted-reading-route.md");
const overreactedSource = readFileSync(overreactedNotePath, "utf8");
const overreactedArticleSlugs = [...overreactedSource.matchAll(/^\d+\. \[[^\]]+\]\(https:\/\/overreacted\.io\/([^/)]+)\/?\)$/gm)].map((match) => match[1]);
const sharingNoteRoutes = [
  ...v8ArticleSlugs.map((slug) => ({ url: `/sharing-notes/v8/${slug}`, output: `sharing-notes/v8/${slug}/index.html` })),
  ...overreactedArticleSlugs.map((slug) => ({ url: `/sharing-notes/overreacted/${slug}`, output: `sharing-notes/overreacted/${slug}/index.html` })),
];

export const STATIC_FIRST_ROUTES = [
	{
		url: "/dashboard",
		output: "dashboard/index.html",
	},
	{
		url: "/projects",
		output: "projects/index.html",
	},
	{
		url: "/open-source",
		output: "open-source/index.html",
	},
	{ url: "/sharing", output: "sharing/index.html" },
	{ url: "/ai-conferences", output: "ai-conferences/index.html" },
	{ url: "/ai-conference-notes/yunqi-2026", output: "ai-conference-notes/yunqi-2026/index.html" },
	{ url: "/ai-conference-notes/yunqi-2026-agentic-os", output: "ai-conference-notes/yunqi-2026-agentic-os/index.html" },
	{ url: "/ai-conference-notes/openai-devday-2026", output: "ai-conference-notes/openai-devday-2026/index.html" },
	{ url: "/ai-conference-notes/berkeley-agentic-ai-2026", output: "ai-conference-notes/berkeley-agentic-ai-2026/index.html" },
	{ url: "/ai-conference-notes/waic-2026", output: "ai-conference-notes/waic-2026/index.html" },
	{ url: "/ai-conference-notes/baai-2026-rl", output: "ai-conference-notes/baai-2026-rl/index.html" },
	{ url: "/ai-conference-notes/build-2026-harness", output: "ai-conference-notes/build-2026-harness/index.html" },
	{ url: "/ai-conference-notes/build-2026-agent-control", output: "ai-conference-notes/build-2026-agent-control/index.html" },
	{ url: "/ai-conference-notes/build-2026-windows-ml", output: "ai-conference-notes/build-2026-windows-ml/index.html" },
	{ url: "/ai-conference-notes/google-io-2026", output: "ai-conference-notes/google-io-2026/index.html" },
	{ url: "/ai-conference-notes/google-cloud-next-2026-data-agents", output: "ai-conference-notes/google-cloud-next-2026-data-agents/index.html" },
	{ url: "/ai-conference-notes/nvidia-gtc-2026", output: "ai-conference-notes/nvidia-gtc-2026/index.html" },
	{ url: "/overreacted-reading-route", output: "overreacted-reading-route/index.html" },
  ...sharingNoteRoutes,
	{
		url: "/evidence",
		output: "evidence/index.html",
	},
	{
		url: "/performance-control",
		output: "performance-control/index.html",
	},
	{
		url: "/performance-control/babysteps",
		output: "performance-control/babysteps/index.html",
	},
	{
		url: "/performance-control/agent-market",
		output: "performance-control/agent-market/index.html",
	},
	{
		url: "/performance-control/personal-ai-agent",
		output: "performance-control/personal-ai-agent/index.html",
	},
	{
		url: "/performance-control/github-profile-studio",
		output: "performance-control/github-profile-studio/index.html",
	},
	{
		url: "/evidence/performance-observability-control",
		output: "evidence/performance-observability-control/index.html",
	},
	{
		url: "/evidence/github-profile-studio",
		output: "evidence/github-profile-studio/index.html",
	},
	{
		url: "/evidence/fullstack-showcase",
		output: "evidence/fullstack-showcase/index.html",
	},
	{
		url: "/evidence/portfolio-sync",
		output: "evidence/portfolio-sync/index.html",
	},
	{
		url: "/evidence/tc-workflow",
		output: "evidence/tc-workflow/index.html",
	},
	{
		url: "/evidence/shared-evidence-verifier",
		output: "evidence/shared-evidence-verifier/index.html",
	},
];

export function createCsrFallbackHtml(template) {
	return template
		.replace('<html lang="en">', '<html lang="zh-CN">')
		.replace(
			"<title>web</title>",
			"<title>Tiancheng Xu · Showcase Dashboard</title>",
		);
}

export function createNotFoundHtml(template) {
	return createCsrFallbackHtml(template)
		.replace(/\s*<script type="module"[^>]*><\/script>/g, "")
		.replace(
			'<div id="app"></div>',
			'<main id="app" data-render-mode="static-404"><h1>页面不存在</h1><p>该地址不属于已发布的作品集页面。</p><a href="/dashboard/">返回作品集首页</a></main>',
		);
}
