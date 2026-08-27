export const STATIC_FIRST_ROUTES = [
	{
		url: "/dashboard",
		output: "dashboard/index.html",
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
];

export function createCsrFallbackHtml(template) {
	return template
		.replace('<html lang="en">', '<html lang="zh-CN">')
		.replace(
			"<title>web</title>",
			"<title>Tiancheng Xu · Showcase Dashboard</title>",
		);
}
