import { describe, expect, it } from "vitest";

import {
	createCsrFallbackHtml,
	STATIC_FIRST_ROUTES,
} from "./prerender-routes.mjs";

describe("static-first route delivery", () => {
	it("includes every published Dashboard deep link", () => {
		expect(STATIC_FIRST_ROUTES).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					url: "/dashboard",
					output: "dashboard/index.html",
				}),
				expect.objectContaining({
					url: "/performance-control?project=performance-observability-control",
					output: "performance-control/index.html",
				}),
				expect.objectContaining({
					url: "/evidence/performance-observability-control",
					output: "evidence/performance-observability-control/index.html",
				}),
				expect.objectContaining({
					url: "/evidence/github-profile-studio",
					output: "evidence/github-profile-studio/index.html",
				}),
				expect.objectContaining({
					url: "/evidence/fullstack-showcase",
					output: "evidence/fullstack-showcase/index.html",
				}),
				expect.objectContaining({
					url: "/evidence/portfolio-sync",
					output: "evidence/portfolio-sync/index.html",
				}),
				expect.objectContaining({
					url: "/evidence/tc-workflow",
					output: "evidence/tc-workflow/index.html",
				}),
			]),
		);
	});

	it("keeps the Vite client entry in the CSR fallback instead of writing a dead redirect", () => {
		const html = createCsrFallbackHtml(
			'<html lang="en"><head><title>web</title></head><body><div id="app"></div><script type="module" src="/assets/app.js"></script></body></html>',
		);

		expect(html).toContain('src="/assets/app.js"');
		expect(html).not.toContain('http-equiv="refresh"');
		expect(html).toContain('<html lang="zh-CN">');
	});
});
