const assert = require("node:assert/strict");
const { mkdirSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { inspectMobileNavigation, inspectNoteBody, inspectHeroTitle } = require("./visual-dom-contract.cjs");
const { inspectDashboardScroll } = require("./visual-dashboard-scroll.cjs");

const base = process.env.VISUAL_BASE_URL || "http://127.0.0.1:4184";
const origin = new URL(base);
if (origin.hostname !== "127.0.0.1" || origin.protocol !== "http:") {
	throw new Error("This isolated regression runner accepts only the owned loopback preview");
}
const executablePath = process.env.BACKSTOP_CHROME_EXECUTABLE;
if (!executablePath) throw new Error("An isolated reviewed Chrome executable is required");
const output = resolve(process.env.VISUAL_REPORT_DIR || "backstop_data/playwright_report");
mkdirSync(output, { recursive: true });
const routes = ["/dashboard", "/projects", "/evidence", "/open-source", "/sharing", "/ai-conferences", "/ai-conference-notes/yunqi-2026", "/sharing-notes/overreacted/what-is-javascript-made-of"];
const results = [];

async function run() {
	const browser = await chromium.launch({ executablePath, headless: true });
	try {
		await inspectDashboardScroll(browser, { base, output, results });
		for (const width of [375, 390, 430, 1440]) {
			const context = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 1100 }, locale: "zh-CN", timezoneId: "UTC", deviceScaleFactor: 1 });
			try {
				await context.route("**/*", (route) => {
					const url = new URL(route.request().url());
					if (url.origin === origin.origin || url.protocol === "data:") return route.continue();
					return route.abort();
				});
				const page = await context.newPage();
				const errors = [];
				page.on("pageerror", (error) => errors.push(error.message));
				for (const path of routes) {
					const response = await page.goto(base + path, { waitUntil: "networkidle" });
					assert.equal(response.status(), 200, path);
					await page.evaluate(() => document.fonts.ready);
					assert.ok((await page.locator("h1").innerText()).trim(), path + " heading");
					await page.waitForFunction(() => !document.querySelector(".pretext-reveal-title__glyph") || [...document.querySelectorAll(".pretext-reveal-title__glyph")].every((node) => Number(getComputedStyle(node).opacity) >= .99), undefined, { timeout: 5000 });
					assert.ok((await page.evaluate(inspectHeroTitle)).healthy, path + " visible hero title");
					assert.ok((await page.evaluate(inspectNoteBody)).healthy, path + " dedicated note body");
					assert.ok((await page.evaluate(inspectMobileNavigation)).healthy, path + " visible hit targets anchored after scrolling");
					const geometry = await page.evaluate(() => {
						const bar = document.querySelector(".portfolio-glass-mobile-nav");
						const links = [...(bar?.querySelectorAll(".portfolio-primary-navigation a") || [])];
						return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, links: links.map((link) => {
							const r = link.getBoundingClientRect();
							return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
						}), locale: Intl.DateTimeFormat().resolvedOptions().locale, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, scale: devicePixelRatio };
					});
					assert.ok(geometry.overflow <= 1, `${path} overflow at ${width}`);
					assert.equal(geometry.locale, "zh-CN");
					assert.equal(geometry.timezone, "UTC");
					assert.equal(geometry.scale, 1);
					if (width < 768) {
						assert.equal(geometry.links.length, 4);
						assert.ok(geometry.links.every((r) => r.left >= -1 && r.right <= width + 1 && r.top >= 0 && r.bottom <= 845 && r.width > 0 && r.height >= 44), `${path} clipped mobile navigation at ${width}`);
						assert.ok(Math.max(...geometry.links.map((r) => r.top)) - Math.min(...geometry.links.map((r) => r.top)) <= 1, `${path} wrapped mobile navigation`);
					}
					assert.deepEqual(errors, [], `${path} page errors`);
					await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
					await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
					const footerTargets = await page.evaluate(() => [...document.querySelectorAll(".portfolio-glass-footer a")].map((link) => {
						const r = link.getBoundingClientRect();
						const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
						return { visible: r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight + 1, hit: Boolean(hit && link.contains(hit)), width: r.width, height: r.height };
					}));
					assert.ok(footerTargets.length > 0 && footerTargets.every((r) => r.visible && r.hit && (width >= 768 || (r.width >= 44 && r.height >= 44))), `${path} footer targets unobstructed`);
					results.push({ path, width, gate: "footer-hit-targets", verdict: "pass" });
					await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
					if (width === 375 || width === 1440) await page.screenshot({ path: resolve(output, `${path.slice(1).replaceAll("/", "-")}-${width}.png`), fullPage: true });
					results.push({ path, width, gate: "route-layout", verdict: "pass" });
				}
				for (const [filter, prefix] of [["V8", "/sharing-notes/v8/"], ["Overreacted", "/sharing-notes/overreacted/"], ["AI 会议", "/ai-conference-notes/"]]) {
					await page.goto(base + "/sharing#sharing-articles", { waitUntil: "networkidle" });
					await page.getByRole("button", { name: new RegExp(`^${filter} ·`) }).click();
					const item = page.locator(".sharing-directory-item").first();
					const summary = item.locator(".sharing-directory-item-link");
					const expected = await summary.getAttribute("href");
					assert.ok(expected.startsWith(prefix));
					const author = item.getByRole("link", { name: "作者原文" });
					assert.equal(await author.getAttribute("target"), "_blank");
					assert.ok((await author.getAttribute("href")).startsWith("https://"));
					await item.locator("p").click();
					await page.waitForURL((url) => url.pathname.replace(/\/$/, "") === expected.replace(/\/$/, ""));
					assert.ok((await page.evaluate(inspectNoteBody)).healthy, expected + " dedicated substantive note body");
					await page.getByRole("link", { name: /返回文章列表/ }).click();
					await page.waitForURL((url) => url.pathname.replace(/\/$/, "") === "/sharing" && url.hash === "#sharing-articles");
					await page.locator("#sharing-articles").waitFor({ state: "visible", timeout: 5000 });
					assert.ok(await page.locator("#sharing-articles").isVisible());
					results.push({ filter, width, gate: "paragraph-click-and-return", verdict: "pass" });
				}
				await page.goto(base + "/sharing#sharing-articles", { waitUntil: "networkidle" });
				await page.getByRole("searchbox", { name: "搜索文章" }).fill("__missing_visual_regression_article__");
				assert.ok(await page.locator(".sharing-directory-empty").isVisible());
				results.push({ width, gate: "empty-search", verdict: "pass" });
				assert.deepEqual(errors, [], "interaction page errors");
			} finally { await context.close(); }
		}
		const context = await browser.newContext();
		try {
			const page = await context.newPage();
			const response = await page.goto(base + "/__missing_visual_regression_route__");
			assert.equal(response.status(), 404);
			results.push({ gate: "unknown-route-404", verdict: "pass" });
		} finally { await context.close(); }
	} finally { await browser.close(); }
}

run().then(() => {
	writeFileSync(resolve(output, "result.json"), JSON.stringify({ verdict: "pass", results }, null, 2));
	console.log(`Playwright: ${results.length}/${results.length} checks passed`);
}).catch((error) => {
	writeFileSync(resolve(output, "result.json"), JSON.stringify({ verdict: "fail", results, error: error.message }, null, 2));
	console.error(error.message);
	process.exitCode = 1;
});
