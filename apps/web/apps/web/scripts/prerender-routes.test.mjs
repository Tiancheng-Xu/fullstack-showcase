import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { PERFORMANCE_APPLICATIONS } from "../src/data/performance-applications";

import {
	createCsrFallbackHtml,
	createNotFoundHtml,
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
					url: "/projects",
					output: "projects/index.html",
				}),
				expect.objectContaining({
					url: "/evidence",
					output: "evidence/index.html",
				}),
				expect.objectContaining({
					url: "/open-source",
					output: "open-source/index.html",
				}),
				expect.objectContaining({
					url: "/performance-control/babysteps",
					output: "performance-control/babysteps/index.html",
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
				expect.objectContaining({
					url: "/evidence/shared-evidence-verifier",
					output: "evidence/shared-evidence-verifier/index.html",
				}),
			]),
		);
	});

	it("pre-renders every registered performance application path", () => {
		expect(STATIC_FIRST_ROUTES.map(({ url }) => url)).toEqual(
			expect.arrayContaining([
				"/performance-control",
				...PERFORMANCE_APPLICATIONS.map(
					({ id }) => `/performance-control/${id}`,
				),
			]),
		);
	});

	it("pre-renders every sharing detail and rewrites both URL forms", () => {
		const redirects = readFileSync(
			resolve(process.cwd(), "public/_redirects"),
			"utf8",
		);
		for (const url of [
			"/sharing",
			"/ai-conferences",
			"/ai-conference-notes/yunqi-2026",
			"/ai-conference-notes/openai-devday-2026",
			"/ai-conference-notes/berkeley-agentic-ai-2026",
			"/ai-conference-notes/waic-2026",
			"/ai-conference-notes/baai-2026-rl",
			"/ai-conference-notes/build-2026-harness",
			"/ai-conference-notes/build-2026-agent-control",
			"/ai-conference-notes/google-io-2026",
			"/ai-conference-notes/nvidia-gtc-2026",
			"/overreacted-reading-route",
		]) {
			const output = `${url.slice(1)}/index.html`;
			expect(STATIC_FIRST_ROUTES).toContainEqual({ url, output });
			expect(redirects).toContain(`${url} /${output} 200`);
			expect(redirects).toContain(`${url}/ /${output} 200`);
		}
	});

	it("keeps the Vite client entry in the CSR fallback instead of writing a dead redirect", () => {
		const html = createCsrFallbackHtml(
			'<html lang="en"><head><title>web</title></head><body><div id="app"></div><script type="module" src="/assets/app.js"></script></body></html>',
		);

		expect(html).toContain('src="/assets/app.js"');
		expect(html).not.toContain('http-equiv="refresh"');
		expect(html).toContain('<html lang="zh-CN">');
	});

	it("builds a readable static 404 without client-side route takeover", () => {
		const html = createNotFoundHtml(
			'<html lang="en"><head><title>web</title></head><body><div id="app"></div><script type="module" src="/assets/app.js"></script></body></html>',
		);

		expect(html).toContain('data-render-mode="static-404"');
		expect(html).toContain("页面不存在");
		expect(html).toContain('href="/dashboard/"');
		expect(html).not.toContain('type="module"');
	});

	it("redirects legacy project and Dashboard evidence paths to their current owners", () => {
		const redirects = readFileSync(
			resolve(process.cwd(), "public/_redirects"),
			"utf8",
		);

		for (const rule of [
			"/evidence/personal-ai-agent https://personal-ai-agent.baby2b.online/evidence/ 301",
			"/evidence/agent-market https://agent-market.baby2b.online/evidence/ 301",
			"/evidence/babysteps https://babysteps.baby2b.online/evidence/ 301",
			"/github-profile-studio https://baby2b.online/evidence/github-profile-studio 301",
			"/portfolio-sync https://baby2b.online/evidence/portfolio-sync 301",
			"/tc-workflow https://baby2b.online/evidence/tc-workflow 301",
		]) {
			expect(redirects).toContain(rule);
		}
	});

	it("rewrites static-first directory routes to their generated index files", () => {
		const redirects = readFileSync(
			resolve(process.cwd(), "public/_redirects"),
			"utf8",
		);

		for (const rule of [
			"/projects /projects/index.html 200",
			"/projects/ /projects/index.html 200",
				"/open-source /open-source/index.html 200",
				"/open-source/ /open-source/index.html 200",
			"/evidence /evidence/index.html 200",
			"/evidence/ /evidence/index.html 200",
			"/evidence/:slug /evidence/:slug/index.html 200",
			"/evidence/:slug/ /evidence/:slug/index.html 200",
			"/performance-control /performance-control/index.html 200",
			"/performance-control/:id /performance-control/:id/index.html 200",
			"/performance-control/:id/ /performance-control/:id/index.html 200",
		]) {
			expect(redirects).toContain(rule);
		}
	});
});
