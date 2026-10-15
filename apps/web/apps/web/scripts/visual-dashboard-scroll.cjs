const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { readFileSync, readdirSync } = require("node:fs");
const { createRequire } = require("node:module");
const { basename, dirname, resolve } = require("node:path");
const { PNG } = createRequire(require.resolve("backstopjs/package.json"))("pngjs");

// Only these reviewed, dependency-free policy/preload artifacts may be shared.
// A renamed or changed artifact fails closed and requires a new review.
const reviewedSharedModules = new Map([
	["voyage-scene-policy-C5J9ZJ0M.js", "071e7ecc558e673fbf83e2a9a55a83e1d53f50c32f3891ee6a0f43ae98ebf7f0"],
	["preload-helper-Czpn1I53.js", "aba87f2a53e45ecdc9113fc30387d16e449d1676428cf5f82dd624c1df97d152"],
]);

function isReviewedSharedModule(file, source, dependencies, bootstrap, registry) {
	return bootstrap.has(file) && dependencies.length === 0 && registry.get(file) === createHash("sha256").update(source).digest("hex");
}

function sceneAssetMap() {
	const assets = resolve(__dirname, "../dist/assets");
	const modules = new Map(readdirSync(assets).filter((file) => file.endsWith(".js"))
		.map((file) => [file, readFileSync(resolve(assets, file), "utf8")]));
	const dependencies = new Map([...modules].map(([file, source]) => [file,
		[...source.matchAll(/\b(?:import\s*(?!\()|export\s*(?:\{[^}]*\}|\*))\s*(?:[^;"']*\bfrom\s*)?["'](\.[^"']+\.js)["']/g)]
			.map((match) => basename(resolve(assets, dirname(file), match[1])))
			.filter((dependency) => modules.has(dependency)),
	]));
	const walk = (seeds) => {
		const visited = new Set();
		const pending = [...seeds];
		while (pending.length) {
			const file = pending.pop();
			if (visited.has(file)) continue;
			visited.add(file);
			pending.push(...(dependencies.get(file) || []));
		}
		return visited;
	};
	const scene = [...modules.keys()].filter((file) => /^portfolio-voyage-scene-.*\.js$/.test(file));
	assert.ok(scene.length > 0, "Built scene chunk must exist for the desktop contract");
	const html = readFileSync(resolve(__dirname, "../dist/dashboard/index.html"), "utf8");
	const entries = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+\.js)["'][^>]*>/g)]
		.map((match) => basename(match[1])).filter((file) => modules.has(file));
	assert.ok(entries.length > 0, "Built Dashboard must declare a module entry");
	// The route itself is lazy-loaded by the HTML entry. Its pure policy and
	// UI dependencies are shared with the scene, but are not Babylon code.
	const dashboardEntries = [...modules.keys()].filter((file) => /^dashboard-.*\.js$/.test(file));
	assert.ok(dashboardEntries.length > 0, "Built Dashboard route entry must exist");
	entries.push(...dashboardEntries);
	const bootstrap = walk(entries);
	const blocked = new Set([...walk(scene)].filter((file) => !isReviewedSharedModule(file, modules.get(file), dependencies.get(file) || [], bootstrap, reviewedSharedModules)));
	for (const file of scene) blocked.add(file);
	for (const [file, source] of modules) {
		if (/Babylon\.js|@babylonjs\//.test(source)) blocked.add(file);
	}
	return blocked;
}

function isSceneRequest(url, blockedAssets) {
	const pathname = new URL(url).pathname;
	return /\.glb$/i.test(pathname) || blockedAssets.has(basename(pathname)) || /(?:portfolio-voyage-scene-|babylon).*\.js$/i.test(pathname);
}

function assertNoSceneActivity(requests, calls, blockedAssets) {
	assert.deepEqual(requests.filter((url) => isSceneRequest(url, blockedAssets)), [], "Mobile must not request the built scene/Babylon dependency graph or GLB");
	assert.equal(calls.length, 0, "Mobile must not create or probe a WebGL context");
}

function monitorWebGL() {
	window.__dashboardWebGLCalls = [];
	for (const type of [window.HTMLCanvasElement, window.OffscreenCanvas].filter(Boolean)) {
		const original = type.prototype.getContext;
		type.prototype.getContext = function (kind, ...args) {
			if (/^(webgl|webgl2|experimental-webgl)$/i.test(String(kind))) window.__dashboardWebGLCalls.push(String(kind));
			return Reflect.apply(original, this, [kind, ...args]);
		};
	}
}

function hasReadableGlyph(node) {
	let readable = 0;
	const colorCanvas = document.createElement("canvas");
	colorCanvas.width = colorCanvas.height = 1;
	const colorContext = colorCanvas.getContext("2d", { willReadFrequently: true });
	if (!colorContext) return false;
	const colors = new Map();
	const nav = document.querySelector(".portfolio-glass-mobile-nav");
	const navRect = nav?.getBoundingClientRect();
	const readingBottom = navRect && navRect.height > 0 && getComputedStyle(nav).position === "fixed" ? Math.min(innerHeight, navRect.top) : innerHeight;
	const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
	for (let text = walker.nextNode(); text; text = walker.nextNode()) {
		const offsets = [...text.textContent.matchAll(/\S/gu)].map((match) => match.index);
		if (!offsets.length) continue;
		let visible = true;
		for (let parent = text.parentElement; parent; parent = parent.parentElement) {
			const style = getComputedStyle(parent);
			if (Number(style.opacity) < .99 || style.visibility !== "visible" || style.display === "none") visible = false;
		}
		if (!visible) continue;
		const textStyle = getComputedStyle(text.parentElement);
		const color = textStyle.webkitTextFillColor || textStyle.color;
		if (!colors.has(color)) {
			colorContext.clearRect(0, 0, 1, 1);
			colorContext.fillStyle = color;
			colorContext.fillRect(0, 0, 1, 1);
			colors.set(color, colorContext.getImageData(0, 0, 1, 1).data[3]);
		}
		if (colors.get(color) === 0) continue;
		const samples = new Set([0, 1, Math.floor(offsets.length / 2), offsets.length - 2, offsets.length - 1].filter((index) => index >= 0 && index < offsets.length));
		for (const sample of samples) {
			const offset = offsets[sample];
			const range = document.createRange();
			range.setStart(text, offset);
			range.setEnd(text, offset + 1);
			const rect = range.getBoundingClientRect();
			if (rect.width <= 0 || rect.height <= 0 || rect.top < 0 || rect.bottom > readingBottom || rect.left < 0 || rect.right > innerWidth) continue;
			const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
		// Decorative map headings intentionally disable pointer events; their
		// containing stage receives the hit even though the glyphs are painted.
			if (!hit || !(node.contains(hit) || (hit.contains(node) && getComputedStyle(text.parentElement).pointerEvents === "none"))) return false;
			readable++;
		}
	}
	return readable > 0;
}

function glyphPaintBoxes(node) {
	const boxes = [];
	const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
	const nav = document.querySelector(".portfolio-glass-mobile-nav");
	const navRect = nav?.getBoundingClientRect();
	const bottom = navRect && navRect.height > 0 && getComputedStyle(nav).position === "fixed" ? Math.min(innerHeight, navRect.top) : innerHeight;
	for (let text = walker.nextNode(); text; text = walker.nextNode()) {
		const offsets = [...text.textContent.matchAll(/\S/gu)].map((match) => match.index);
		if (!offsets.length) continue;
		let visible = true;
		for (let parent = text.parentElement; parent; parent = parent.parentElement) {
			const style = getComputedStyle(parent);
			if (Number(style.opacity) < .99 || style.visibility !== "visible" || style.display === "none") visible = false;
		}
		if (!visible) continue;
		for (const index of new Set([0, Math.floor(offsets.length / 2), offsets.length - 1])) {
			const range = document.createRange();
			range.setStart(text, offsets[index]);
			range.setEnd(text, offsets[index] + 1);
			const rect = range.getBoundingClientRect();
			if (rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.bottom <= bottom && rect.left >= 0 && rect.right <= innerWidth) boxes.push({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
		}
	}
	return boxes;
}

async function assertGlyphPaint(locator, label) {
	const boxes = await locator.evaluate(glyphPaintBoxes);
	assert.ok(boxes.length > 0, label + " has no glyph in the reading viewport");
	const viewport = locator.page().viewportSize();
	const image = PNG.sync.read(await locator.page().screenshot({ type: "png", fullPage: false }));
	const saved = await locator.evaluate((node) => [node, ...node.querySelectorAll("*")].map((element) => {
		const properties = ["-webkit-text-fill-color", "-webkit-text-stroke-color", "text-shadow"];
		const values = properties.map((property) => [property, element.style.getPropertyValue(property), element.style.getPropertyPriority(property)]);
		element.style.setProperty("-webkit-text-fill-color", "transparent", "important");
		element.style.setProperty("-webkit-text-stroke-color", "transparent", "important");
		element.style.setProperty("text-shadow", "none", "important");
		return values;
	}));
	let hidden;
	try {
		hidden = PNG.sync.read(await locator.page().screenshot({ type: "png", fullPage: false }));
	} finally {
		await locator.evaluate((node, saved) => [node, ...node.querySelectorAll("*")].forEach((element, index) => {
			for (const [property, value, priority] of saved[index]) {
				if (value) element.style.setProperty(property, value, priority);
				else element.style.removeProperty(property);
			}
		}), saved);
	}
	assert.equal(hidden.width, image.width);
	assert.equal(hidden.height, image.height);
	const scaleX = image.width / viewport.width;
	const scaleY = image.height / viewport.height;
	for (const box of boxes) {
		let painted = 0;
		for (let y = Math.max(0, Math.floor(box.y * scaleY)); y < Math.min(image.height, Math.ceil((box.y + box.height) * scaleY)); y++) {
			for (let x = Math.max(0, Math.floor(box.x * scaleX)); x < Math.min(image.width, Math.ceil((box.x + box.width) * scaleX)); x++) {
				const offset = (y * image.width + x) * 4;
				const difference = Math.max(...[0, 1, 2].map((channel) => Math.abs(image.data[offset + channel] - hidden.data[offset + channel])));
				if (difference >= 20) painted++;
			}
		}
		// Only the text's own paint is removed; layout and backgrounds remain.
		// An opaque patterned cover therefore cannot masquerade as a glyph.
		assert.ok(painted >= 2, label + " lacks a painted glyph (transparent text or visual occlusion)");
	}
}

async function assertReadable(locator, label) {
	// Allow the scroll-triggered observer to register the entrance animation
	// before checking it; otherwise a pre-animation pass races its first frame.
	await locator.page().evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
	const handle = await locator.elementHandle();
	try {
		await locator.page().waitForFunction(hasReadableGlyph, handle, { timeout: 5000 });
	} finally { await handle?.dispose(); }
	assert.ok(await locator.evaluate(hasReadableGlyph), label);
	await assertGlyphPaint(locator, label);
}

async function inspectReadableContent(container, label) {
	const heading = container.locator("h2, h3, h4").first();
	if (await heading.count()) {
		await heading.evaluate((node) => scrollTo({ top: node.getBoundingClientRect().top + scrollY - 100, behavior: "instant" }));
		await assertReadable(heading, label + " heading");
	}
	// Short capability/education/OSS records are metadata, not article prose.
	// Project narratives retain 20 characters and may use a real bullet list.
	const conciseRecord = await container.evaluate((node) => node.matches('[data-testid="capability-domain"]') ||
		(node.matches("article.portfolio-glass-subpanel") && node.querySelector("h3")?.textContent === "教育经历"));
	const minimumBodyLength = conciseRecord ? 8 : 20;
	let paragraph = container.locator("p:not(.sr-only), ul > li").filter({ hasText: new RegExp(`\\S.{${minimumBodyLength - 1}}`, "s") }).first();
	if (!await paragraph.count() && await container.evaluate((node) => node.matches("article.portfolio-glass-subpanel"))) {
		// Only the exact OSS status paragraph is concise, never another role
		// label or list on the same card. Hidden status still fails painting.
		paragraph = container.locator("p:not(.sr-only)").filter({ hasText: /^已合并\s+\d+\s*·\s*开放\s+\d+\s*$/ }).first();
	}
	assert.equal(await paragraph.count(), 1, label + " must have substantive body text");
	await paragraph.evaluate((node) => scrollTo({ top: node.getBoundingClientRect().top + scrollY - 100, behavior: "instant" }));
	await assertReadable(paragraph, label + " body");
}

async function inspectNegativeControls(browser, results, blockedAssets) {
	const pure = "export const policy = 1;";
	const registry = new Map([["policy-fixture.js", createHash("sha256").update(pure).digest("hex")]]);
	const bootstrap = new Set(["policy-fixture.js", "shared-engine-fixture.js"]);
	assert.equal(isReviewedSharedModule("policy-fixture.js", pure, [], bootstrap, registry), true);
	assert.equal(isReviewedSharedModule("policy-fixture.js", pure + "new Engine();", [], bootstrap, registry), false);
	assert.equal(isReviewedSharedModule("policy-fixture.js", pure, ["shared-engine-fixture.js"], bootstrap, registry), false);
	assert.equal(isReviewedSharedModule("shared-engine-fixture.js", pure, [], bootstrap, registry), false, "A bootstrap dependency is not automatically a pure shared module");
	const context = await browser.newContext({ viewport: { width: 400, height: 745 } });
	try {
		await context.addInitScript(monitorWebGL);
		const page = await context.newPage();
		await page.goto("about:blank");
		await page.setContent('<h2>Visible heading</h2><p style="opacity:0">A substantive paragraph whose visibility must be checked independently from its heading.</p>');
		assert.equal(await page.locator("h2").evaluate(hasReadableGlyph), true);
		assert.equal(await page.locator("p").evaluate(hasReadableGlyph), false, "A visible heading must not hide an unreadable body");
		await page.locator("p").evaluate((node) => { node.style.opacity = "1"; });
		assert.equal(await page.locator("p").evaluate(hasReadableGlyph), true);
		await page.locator("p").evaluate((node) => { node.style.color = "transparent"; });
		assert.equal(await page.locator("p").evaluate(hasReadableGlyph), false, "Transparent text must not pass a hit-test-only reading gate");
		await page.locator("p").evaluate((node) => { node.style.color = ""; });
		await page.locator("p").evaluate((node) => {
			const rect = node.getBoundingClientRect();
			const cover = document.createElement("div");
			cover.id = "body-cover";
			Object.assign(cover.style, { position: "fixed", zIndex: "999", background: "white", left: rect.left + "px", top: rect.top + "px", width: rect.width + "px", height: rect.height + "px" });
			document.body.append(cover);
		});
		assert.equal(await page.locator("h2").evaluate(hasReadableGlyph), true);
		assert.equal(await page.locator("p").evaluate(hasReadableGlyph), false, "An overlaid body must fail even when the heading is readable");
		await page.locator("#body-cover").evaluate((node) => { node.style.pointerEvents = "none"; });
		assert.equal(await page.locator("p").evaluate(hasReadableGlyph), true, "Control demonstrates why hit testing alone misses a pointer-transparent cover");
		await assert.rejects(() => assertReadable(page.locator("p"), "Pointer-transparent body cover"), /lacks a painted glyph/);
		await page.locator("#body-cover").evaluate((node) => {
			node.style.background = "repeating-linear-gradient(90deg, black 0 2px, white 2px 4px)";
		});
		assert.equal(await page.locator("p").evaluate(hasReadableGlyph), true);
		await assert.rejects(() => assertReadable(page.locator("p"), "Patterned pointer-transparent cover"), /lacks a painted glyph/);
		await page.locator("#body-cover").evaluate((node) => node.remove());
		assert.equal(await page.locator("p").evaluate(hasReadableGlyph), true);
		await assertReadable(page.locator("p"), "Restored substantive paragraph");
		await page.setContent('<section data-testid="capability-domain"><h3>Full Stack / Data</h3><p class="sr-only">作者：Tiancheng Xu（Tiancheng-Xu）</p><p>多运行时产品、接口、数据与渲染工程</p></section>');
		await inspectReadableContent(page.locator("section"), "Concise capability domain");
		await page.locator("p:not(.sr-only)").evaluate((node) => { node.textContent = ""; });
		await assert.rejects(() => inspectReadableContent(page.locator("section"), "Empty capability domain"), /must have substantive body text/);
		await page.setContent('<article class="portfolio-glass-subpanel"><h3>教育经历</h3><p>浙江大学宁波理工学院</p><p>全日制本科 · 学士学位</p></article>');
		await inspectReadableContent(page.locator("article"), "Education metadata");
		await page.locator("p").evaluateAll((nodes) => nodes.forEach((node) => { node.textContent = ""; }));
		await assert.rejects(() => inspectReadableContent(page.locator("article"), "Empty education record"), /must have substantive body text/);
		await page.setContent('<article class="portfolio-glass-subpanel"><h3>Vite</h3><p>已合并 2 · 开放 0</p></article>');
		await inspectReadableContent(page.locator("article"), "OSS status metadata");
		await page.locator("p").evaluate((node) => { node.textContent = ""; });
		await assert.rejects(() => inspectReadableContent(page.locator("article"), "Empty OSS record"), /must have substantive body text/);
		await page.setContent('<article class="portfolio-glass-subpanel"><h3>Vite</h3><p>全栈 / Edge Web3</p><p style="opacity:0">已合并 2 · 开放 0</p></article>');
		await assert.rejects(() => inspectReadableContent(page.locator("article"), "Role label cannot hide OSS status"), /Timeout/);
		await page.setContent('<article class="portfolio-glass-subpanel"><h4>BabySteps</h4><p>全栈 / Edge Web3</p><ul><li>连接成长任务、家长中心与链上交互，分别校验钱包连接、网络就绪、业务授权和交易确认。</li></ul></article>');
		await inspectReadableContent(page.locator("article"), "Bullet-list project narrative");
		await page.locator("li").evaluate((node) => { node.textContent = ""; });
		await assert.rejects(() => inspectReadableContent(page.locator("article"), "Role label without narrative"), /must have substantive body text/);
		const sharedAsset = "shared-engine-fixture.js";
		const fixtures = new Set([...blockedAssets, sharedAsset]);
		assert.throws(() => assertNoSceneActivity(["https://example.test/assets/" + sharedAsset + "?v=1"], [], fixtures));
		assert.throws(() => assertNoSceneActivity(["https://example.test/boat.GLB?v=1"], [], fixtures));
		await page.evaluate(() => document.createElement("canvas").getContext("webgl"));
		const awaitCalls = await page.evaluate(() => window.__dashboardWebGLCalls);
		assert.throws(() => assertNoSceneActivity([], awaitCalls, fixtures), /WebGL/);
		results.push({ gate: "dashboard-reading-and-scene-negative-controls", verdict: "pass" });
	} finally { await context.close(); }
}

// Keep physical, short viewports: full-document screenshots and reduced-motion
// captures cannot prove that normal scrolling reveals a very tall section.
async function inspectDashboardScroll(browser, { base, output, results }) {
	const blockedAssets = sceneAssetMap();
	await inspectNegativeControls(browser, results, blockedAssets);
	for (const [width, height] of [[320, 568], [375, 667], [390, 844], [400, 745], [430, 932], [1440, 900]]) {
		const context = await browser.newContext({
			viewport: { width, height }, locale: "zh-CN", timezoneId: "UTC",
			reducedMotion: "no-preference", isMobile: width < 768, hasTouch: width < 768,
		});
		try {
			if (width < 768) await context.addInitScript(monitorWebGL);
			await context.route("**/*", (route) => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
			const page = await context.newPage();
			const errors = [];
			const requests = [];
			page.on("request", (request) => requests.push(request.url()));
			page.on("pageerror", (error) => errors.push(error.message));
			assert.equal((await page.goto(base + "/dashboard", { waitUntil: "networkidle" })).status(), 200);
			await page.evaluate(() => document.fonts.ready);
			await page.locator("#skills[data-portfolio-reveal]").waitFor({ state: "attached", timeout: 5000 });
			if (width < 768) {
				const poster = await page.evaluate(async () => {
					const fallback = document.querySelector(".portfolio-voyage__fallback");
					const image = new Image();
					image.src = "/assets/portfolio/voyage-mobile-poster.webp";
					await image.decode();
					return {
						background: getComputedStyle(fallback).backgroundImage,
						opacity: getComputedStyle(fallback).opacity,
						width: image.naturalWidth,
						state: document.querySelector(".portfolio-voyage").dataset.sceneState,
					};
				});
				assert.ok(poster.background.includes("voyage-mobile-poster.webp"));
				assert.equal(poster.width, 960);
				assert.equal(poster.opacity, "1");
				assert.equal(poster.state, "static");
				assertNoSceneActivity(requests, await page.evaluate(() => window.__dashboardWebGLCalls), blockedAssets);
				results.push({ width, height, gate: "dashboard-mobile-static-poster", verdict: "pass" });
				await page.waitForFunction(() => {
					const title = document.querySelector("#portfolio-voyage-title");
					const lines = [...title.querySelectorAll(".pretext-reveal-title__line")];
					return lines.length > 0 && lines.every((line) => line.textContent.trim().length > 1);
				}, undefined, { timeout: 5000 });
				const separated = await page.evaluate(() => {
					const link = document.querySelector(".portfolio-voyage__content a").getBoundingClientRect();
					const credit = document.querySelector(".portfolio-voyage__credit").getBoundingClientRect();
					return link.bottom + 8 <= credit.top;
				});
				assert.ok(separated, `Dashboard hero credit overlaps action at ${width}x${height}`);
				results.push({ width, height, gate: "dashboard-mobile-title-and-credit", verdict: "pass" });
			}
			const sections = page.locator("main section");
			assert.ok(await sections.count() > 0);
			for (let index = 0; index < await sections.count(); index++) {
				const section = sections.nth(index);
				await section.evaluate((node) => window.scrollTo({ top: node.getBoundingClientRect().top + scrollY - 100, behavior: "instant" }));
				await page.waitForFunction((index) => {
					let node = document.querySelectorAll("main section")[index];
					while (node) {
						const style = getComputedStyle(node);
						if (node.hasAttribute("data-portfolio-reveal") && !node.classList.contains("portfolio-reveal--visible")) return false;
						if (Number(style.opacity) < .99 || style.visibility !== "visible" || style.display === "none") return false;
						node = node.parentElement;
					}
					return true;
				}, index, { timeout: 5000 });
				await inspectReadableContent(section, `Dashboard section ${index} at ${width}x${height}`);
				results.push({ width, height, section: index, gate: "dashboard-normal-motion-scroll", verdict: "pass" });
				if (width === 400 && index === 0) await page.screenshot({ path: resolve(output, "dashboard-400x745-resume-scroll.png") });
			}
			const cards = page.locator("main article[data-portfolio-reveal], .resume-core-capabilities li");
			assert.ok(await cards.count() > 0);
			for (let index = 0; index < await cards.count(); index++) {
				const card = cards.nth(index);
				await card.evaluate((node) => scrollTo({ top: node.getBoundingClientRect().top + scrollY - 100, behavior: "instant" }));
				await page.waitForFunction((index) => {
					const card = document.querySelectorAll("main article[data-portfolio-reveal], .resume-core-capabilities li")[index];
					return !card.hasAttribute("data-portfolio-reveal") || card.classList.contains("portfolio-reveal--visible");
				}, index, { timeout: 5000 });
				await inspectReadableContent(card, `Dashboard card ${index} at ${width}x${height}`);
				results.push({ width, height, card: index, gate: "dashboard-normal-motion-card-reading", verdict: "pass" });
			}
			if (width < 768) {
				assertNoSceneActivity(requests, await page.evaluate(() => window.__dashboardWebGLCalls), blockedAssets);
				results.push({ width, height, gate: "dashboard-mobile-no-scene-after-scroll", verdict: "pass", blockedAssets: [...blockedAssets] });
			}
			assert.deepEqual(errors, [], "Dashboard normal-motion page errors");
		} finally { await context.close(); }
	}
	const context = await browser.newContext({ viewport: { width: 400, height: 745 }, reducedMotion: "no-preference" });
	try {
		await context.route("**/*", (route) => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
		// An available but stalled observer must not be a prerequisite for reading.
		await context.addInitScript(() => {
			window.IntersectionObserver = class {
				observe() {} unobserve() {} disconnect() {} takeRecords() { return []; }
			};
		});
		const page = await context.newPage();
		await page.goto(base + "/dashboard", { waitUntil: "networkidle" });
		await page.locator("#skills[data-portfolio-reveal]").waitFor({ state: "attached", timeout: 5000 });
		const paragraph = page.locator("#skills > .portfolio-dashboard-module-card > p").first();
		await paragraph.evaluate((node) => scrollTo({ top: node.getBoundingClientRect().top + scrollY - 100, behavior: "instant" }));
		await assertReadable(paragraph, "Stalled observer must preserve painted resume text");
		assert.equal(await page.locator("#skills").evaluate((node) => node.classList.contains("portfolio-reveal--visible")), false, "Stalled observer must not masquerade as a completed reveal");
		await paragraph.evaluate((node) => { node.style.opacity = "0"; });
		assert.equal(await paragraph.evaluate(hasReadableGlyph), false, "The reading gate must reject transparent text inside a visible section");
		await paragraph.evaluate((node) => { node.style.opacity = ""; });
		results.push({ width: 400, height: 745, gate: "dashboard-stalled-observer-readable", verdict: "pass" });
	} finally { await context.close(); }
	await require("./visual-voyage-cancellation.cjs").inspectVoyageCancellation(browser.browserType(), { base, output, results });
}

module.exports = { inspectDashboardScroll };
