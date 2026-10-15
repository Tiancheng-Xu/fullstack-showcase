const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { test } = require("node:test");
const { runInNewContext } = require("node:vm");
const { JSDOM } = require("jsdom");

const source = readFileSync(resolve(__dirname, "../backstop_data/engine_scripts/puppet/onReady.cjs"), "utf8");

async function checkNavigation({ barWidth = 390, barTop = 780, barHeight = 64, rectangles, missing = false, route = "/projects", articleBody = "", hidden = false, relative = false, moving = false, obstructed = false } = {}) {
	const dom = new JSDOM('<!doctype html><html><head></head><body><h1>项目索引</h1><div class="portfolio-glass-mobile-nav"><nav class="portfolio-primary-navigation"><a href="/dashboard">首页</a><a href="/projects">项目</a><a href="/open-source">开源共建</a><a href="/sharing">分享</a></nav></div></body></html>', { url: "https://example.test/projects" });
	const { window } = dom;
	const { document } = window;
	window.history.replaceState(null, "", route);
	if (route.startsWith("/sharing-notes/")) document.querySelector("h1").textContent = "What Is JavaScript Made Of?";
	Object.defineProperty(window.HTMLElement.prototype, "innerText", {
		get() { return this.textContent; },
	});
	if (articleBody) document.body.insertAdjacentHTML("beforeend", articleBody);
	const noteBody = document.querySelector(".reading-route-body");
	if (noteBody) noteBody.getBoundingClientRect = () => new window.DOMRect(0, 100, 360, 400);
	Object.defineProperty(window, "innerWidth", { value: 390 });
	Object.defineProperty(window, "innerHeight", { value: 844 });
	Object.defineProperty(window, "devicePixelRatio", { value: 1 });
	Object.defineProperty(document, "fonts", { value: { ready: Promise.resolve() } });
	let scrollPosition = 0;
	Object.defineProperty(window, "scrollY", { get: () => scrollPosition });
	Object.defineProperty(document.documentElement, "scrollHeight", { value: 2000 });
	window.scrollTo = (x, y) => { scrollPosition = typeof x === "object" ? x.top : y; };
	window.Range.prototype.getClientRects = () => [new window.DOMRect(0, 100, 360, 40)];
	const bar = document.querySelector(".portfolio-glass-mobile-nav");
	bar.style.position = relative ? "relative" : "fixed";
	if (hidden) bar.style.visibility = "hidden";
	bar.getBoundingClientRect = () => new window.DOMRect(0, barTop - (moving ? scrollPosition : 0), barWidth, barHeight);
	const boxes = rectangles || [[10, 788, 85, 48], [105, 788, 85, 48], [200, 788, 85, 48], [295, 788, 85, 48]];
	[...bar.querySelectorAll("a")].forEach((link, index) => {
		link.getBoundingClientRect = () => new window.DOMRect(boxes[index][0], boxes[index][1] - (moving ? scrollPosition : 0), boxes[index][2], boxes[index][3]);
	});
	document.elementFromPoint = (x, y) => obstructed ? document.body : [...bar.querySelectorAll("a")].find((link) => { const r = link.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; }) || null;
	if (missing) bar.remove();
	const context = {
		module: { exports: {} }, document, window, location: window.location,
		Element: window.Element, NodeFilter: window.NodeFilter, innerWidth: 390, innerHeight: 844,
		getComputedStyle: window.getComputedStyle.bind(window),
		requestAnimationFrame: (callback) => callback(0),
		require: () => require("./visual-dom-contract.cjs"),
		Intl: { DateTimeFormat: () => ({ resolvedOptions: () => ({ locale: "zh-CN", timeZone: "UTC" }) }) },
		fetch: async () => ({ status: 200 }),
		setTimeout: (callback) => callback(),
	};
	runInNewContext(source, context, { timeout: 1000 });
	try {
		await context.module.exports({
			__visualPageErrors: [],
			evaluate: async (callback, ...arguments_) => runInNewContext(`(${callback.toString()})(...__arguments)`, { ...context, get scrollY() { return scrollPosition; }, __arguments: arguments_ }, { timeout: 1000 }),
		});
	} finally {
		window.close();
	}
}

test("accepts four touch targets inside one mobile navigation row", async () => {
	await checkNavigation();
});

test("rejects a target clipped outside the viewport even with no document overflow", async () => {
	await assert.rejects(checkNavigation({
		barWidth: 520,
		rectangles: [[10, 788, 85, 48], [105, 788, 85, 48], [395, 788, 92, 48], [295, 788, 85, 48]],
	}), /"mobileNavigationHealthy":false/);
});

test("rejects a wrapped navigation row even if every target remains inside the bar", async () => {
	await assert.rejects(checkNavigation({
		barTop: 724,
		barHeight: 120,
		rectangles: [[10, 728, 85, 48], [105, 728, 85, 48], [200, 728, 85, 48], [10, 784, 85, 48]],
	}), /"mobileNavigationHealthy":false/);
});

test("rejects a missing mobile navigation instead of passing an empty selection", async () => {
	await assert.rejects(checkNavigation({ missing: true }), /"mobileNavigationHealthy":false/);
});

test("rejects a sharing page with only the navigation label", async () => {
	await assert.rejects(checkNavigation({ route: "/sharing" }), /"sharingDirectoryHealthy":false/);
});

test("rejects an article directory without summary entry links", async () => {
	await assert.rejects(checkNavigation({ route: "/sharing", articleBody: '<section id="sharing-articles">文章目录</section>' }), /"sharingDirectoryHealthy":false/);
});

test("rejects directory links without the article directory marker", async () => {
	await assert.rejects(checkNavigation({ route: "/sharing", articleBody: '<section id="sharing-articles"><a href="/sharing-notes/v8/sparkplug">Sparkplug</a></section>' }), /"sharingDirectoryHealthy":false/);
});

test("accepts an article directory with a summary entry", async () => {
	await checkNavigation({ route: "/sharing", articleBody: '<section id="sharing-articles">文章目录<a href="/sharing-notes/v8/sparkplug">Sparkplug</a></section>' });
});

test("rejects narrow, hidden, relative, scroll-moving and obstructed navigation", async () => {
	for (const options of [{ rectangles: [[10, 788, 20, 48], [105, 788, 85, 48], [200, 788, 85, 48], [295, 788, 85, 48]] }, { hidden: true }, { relative: true }, { moving: true }, { obstructed: true }]) {
		await assert.rejects(checkNavigation(options), /"mobileNavigationHealthy":false/);
	}
});

test("rejects a valid note title with unrelated text but no dedicated note body", async () => {
	await assert.rejects(checkNavigation({ route: "/sharing-notes/overreacted/what-is-javascript-made-of", articleBody: `<main><p>${"unrelated ".repeat(50)}</p></main>` }), /"summaryBodyHealthy":false/);
});

test("rejects heading-only notes and boilerplate boundaries without summary content", async () => {
	for (const body of ['<h2>我的总结</h2>', `<h2>我的总结</h2><p class="sharing-note-boundary">${"boundary ".repeat(50)}</p>`]) {
		await assert.rejects(checkNavigation({ route: "/sharing-notes/overreacted/what-is-javascript-made-of", articleBody: `<article class="sharing-article-note"><section class="reading-route-body">${body}</section></article>` }), /"summaryBodyHealthy":false/);
	}
});

test("accepts substantive content in the dedicated note body", async () => {
	await checkNavigation({ route: "/sharing-notes/overreacted/what-is-javascript-made-of", articleBody: `<article class="sharing-article-note"><section class="reading-route-body"><h2>我的总结</h2><p>${"technical insight ".repeat(10)}</p><p>${"practice judgement ".repeat(10)}</p></section></article>` });
});

test("rejects transparent paragraphs and transparent descendant text", async () => {
	for (const content of [`<p style="opacity:0">${"invisible ".repeat(30)}</p><p style="opacity:0">${"invisible ".repeat(30)}</p>`, `<p><span style="opacity:0">${"invisible ".repeat(30)}</span></p><p><span style="opacity:0">${"invisible ".repeat(30)}</span></p>`]) {
		await assert.rejects(checkNavigation({ route: "/sharing-notes/overreacted/what-is-javascript-made-of", articleBody: `<article class="sharing-article-note"><section class="reading-route-body"><h2>我的总结</h2>${content}</section></article>` }), /"summaryBodyHealthy":false/);
	}
});
