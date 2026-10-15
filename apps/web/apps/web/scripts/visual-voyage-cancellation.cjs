const assert = require("node:assert/strict");
const { mkdirSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");

async function inspectVoyageCancellation(browserType, { base, output, results }) {
	const executablePath = process.env.BACKSTOP_CHROME_EXECUTABLE;
	assert.ok(executablePath, "A pinned Chrome executable is required");
	for (const mode of ["resize", "unmount", "failure", "model", "model-unmount"]) {
		// A fresh software GPU process prevents prior controlled failures and
		// cancelled loaders from contaminating the next native resource case.
		const browser = await browserType.launch({ executablePath, headless: true,
			args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--lang=zh-CN", "--no-sandbox"] });
		try {
			const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference", locale: "zh-CN", timezoneId: "UTC" });
			let release;
			let cancelling = false;
			const held = new Promise((resolve) => { release = resolve; });
			try {
				await context.addInitScript(({ mode }) => {
					window.__voyageProbe = { contexts: [], pendingImage: false, drawingFailed: false, gpuProbes: [] };
					const getContext = HTMLCanvasElement.prototype.getContext;
					HTMLCanvasElement.prototype.getContext = function (...args) {
						const startedAt = performance.now();
						const gl = Reflect.apply(getContext, this, args);
						if (/^(webgl|webgl2|experimental-webgl)$/i.test(String(args[0]))) window.__voyageProbe.gpuProbes.push({ kind: args[0], available: !!gl, canvas: this.className, startedAt, elapsedMs: performance.now() - startedAt });
						if (this.matches(".portfolio-voyage__canvas") && gl && typeof gl.isTexture === "function" && !window.__voyageProbe.contexts.some((entry) => entry.gl === gl)) {
							const entry = { gl, textures: [] };
							window.__voyageProbe.contexts.push(entry);
							const createTexture = gl.createTexture;
							gl.createTexture = function (...values) {
								const texture = Reflect.apply(createTexture, this, values);
								if (texture) entry.textures.push(texture);
								return texture;
							};
						}
						return gl;
					};
					const NativeImage = window.Image;
					const source = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
					window.Image = function (...args) {
						const image = new NativeImage(...args);
						Object.defineProperty(image, "src", { configurable: true,
							get() { return source.get.call(image); },
							set(value) {
								const url = new URL(value, location.href);
								if (url.pathname === "/assets/portfolio/twos-complement-ring.png") {
									url.searchParams.set("scene-cancellation-probe", "1");
									window.__voyageProbe.pendingImage = true;
								}
								source.set.call(image, url.href);
							},
						});
						return image;
					};
					window.Image.prototype = NativeImage.prototype;
					if (mode === "failure") {
						const drawImage = CanvasRenderingContext2D.prototype.drawImage;
						CanvasRenderingContext2D.prototype.drawImage = function (image, ...args) {
							if (image?.src?.includes("scene-cancellation-probe=1")) {
								window.__voyageProbe.drawingFailed = true;
								throw new Error("Controlled scene image-drawing failure");
							}
							return Reflect.apply(drawImage, this, [image, ...args]);
						};
					}
				}, { mode });
				await context.route("**/*", async (route) => {
					const url = new URL(route.request().url());
					if (url.origin !== new URL(base).origin) return route.abort();
					if ((!mode.startsWith("model") && url.searchParams.get("scene-cancellation-probe") === "1") || (mode.startsWith("model") && /\.glb$/i.test(url.pathname))) {
						await held;
						try { await route.continue(); } catch (error) { if (!cancelling) throw error; }
						return;
					}
					await route.continue();
				});
				const page = await context.newPage();
				const errors = [];
				const requests = [];
				const diagnostics = [];
				page.on("pageerror", (error) => errors.push(error.message));
				page.on("request", (request) => requests.push(request.url()));
				page.on("console", (message) => {
					if (message.type() === "error") diagnostics.push(message.text());
				});
				page.on("response", (response) => {
					if (response.status() >= 400) diagnostics.push(`${response.status()} ${response.url()}`);
				});
				const response = await page.goto(base + "/dashboard", { waitUntil: "domcontentloaded" });
				assert.equal(response.status(), 200);
				// Cold SwiftShader context creation is synchronous and measured above
				// at over 11 seconds. This is startup setup, not the 5-second release
				// contract checked after cancellation below.
				await page.waitForFunction(() => document.querySelector(".portfolio-voyage")?.dataset.sceneState === "loading", undefined, { timeout: 30000, polling: 100 });
				// The loading overlay precedes synchronous GPU construction. Wait
				// for the real scene image setup before starting the network budget.
				await page.waitForFunction(() => window.__voyageProbe.pendingImage, undefined, { timeout: 30000, polling: 100 });
				const matchesResource = (url) => mode.startsWith("model") ? /\.glb$/i.test(new URL(url).pathname) : new URL(url).searchParams.get("scene-cancellation-probe") === "1";
				// Record requests before navigation, but start the resource deadline
				// only after the product has entered initialization. Navigation and
				// deferred scene startup have their own bounded waits above.
				if (!requests.some(matchesResource)) await page.waitForRequest((request) => matchesResource(request.url()), { timeout: 20000 }).catch(async (error) => {
					const state = await page.evaluate(() => ({ ready: document.readyState,
						scene: document.querySelector(".portfolio-voyage")?.dataset.sceneState,
						pendingImage: window.__voyageProbe.pendingImage,
						contexts: window.__voyageProbe.contexts.length }));
					throw new Error(`${mode}: ${error.message}; ${JSON.stringify({ state, errors, diagnostics, requests })}`, { cause: error });
				});
				await page.waitForFunction(() => window.__voyageProbe.contexts.some(({ gl, textures }) => textures.some((texture) => gl.isTexture(texture))), undefined, { timeout: 5000, polling: 100 });
				assert.equal(await page.locator(".portfolio-voyage").getAttribute("data-scene-state"), "loading");
				const textureCount = await page.evaluate(() => window.__voyageProbe.contexts.reduce((count, entry) => count + entry.textures.length, 0));
				if (mode === "resize" || mode === "model") {
					cancelling = true;
					await page.setViewportSize({ width: 400, height: 745 });
					await page.waitForFunction(() => document.querySelector(".portfolio-voyage").dataset.sceneState === "static", undefined, { timeout: 5000, polling: 100 });
				} else if (mode === "unmount" || mode === "model-unmount") {
					cancelling = true;
					await page.locator('header a[href="/sharing"]').first().click();
					await page.waitForURL(/\/sharing\/?$/, { timeout: 5000 });
					await page.locator(".portfolio-voyage__canvas").waitFor({ state: "detached", timeout: 5000 });
					assert.equal(await page.locator(".portfolio-voyage__canvas").count(), 0);
				} else {
					release();
					await page.waitForFunction(() => window.__voyageProbe.drawingFailed && document.querySelector(".portfolio-voyage").dataset.sceneState === "failed", undefined, { timeout: 5000, polling: 100 });
				}
				await page.waitForFunction(() => window.__voyageProbe.contexts.every(({ gl, textures }) => textures.every((texture) => !gl.isTexture(texture))), undefined, { timeout: 5000, polling: 100 });
				release();
				await page.waitForLoadState("networkidle", { timeout: 10000 });
				assert.equal(await page.evaluate(() => window.__voyageProbe.contexts.reduce((count, entry) => count + entry.textures.length, 0)), textureCount, "Cancellation must not create even a short-lived late GPU texture");
				assert.equal(requests.filter((url) => /\.glb$/i.test(new URL(url).pathname)).length, mode.startsWith("model") ? 1 : 0, "Cancellation must not continue or repeat boat-model loading");
				assert.equal(await page.evaluate(() => window.__voyageProbe.contexts.some(({ gl, textures }) => textures.some((texture) => gl.isTexture(texture)))), false, "A late asset response must not recreate GPU textures");
				assert.deepEqual(errors, [], "Initialization failures must be handled without page errors");
				results.push({ gate: "voyage-pending-initialization-" + mode, verdict: "pass", realWebGL: true, texturesReleased: true });
			} catch (error) {
				const page = context.pages()[0];
				const state = page && await page.evaluate(() => ({ ready: document.readyState, visible: document.visibilityState,
					width: innerWidth, reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
					scene: document.querySelector(".portfolio-voyage")?.dataset.sceneState,
					pendingImage: window.__voyageProbe?.pendingImage, gpuProbes: window.__voyageProbe?.gpuProbes }));
				if (page && output) await page.screenshot({ path: resolve(output, `cancellation-${mode}-failure.png`) });
				throw new Error(`${mode}: ${error.message}; ${JSON.stringify(state)}`, { cause: error });
			} finally {
				cancelling = true;
				release();
				await context.close();
			}
		} finally { await browser.close(); }
	}
}

module.exports = { inspectVoyageCancellation };

if (require.main === module) {
	const output = process.env.VISUAL_REPORT_DIR;
	assert.ok(output, "VISUAL_REPORT_DIR is required");
	mkdirSync(output, { recursive: true });
	const results = [];
	const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
	inspectVoyageCancellation(chromium, { base: process.env.VISUAL_BASE_URL || "http://127.0.0.1:4184", output, results })
		.then(() => { writeFileSync(resolve(output, "result.json"), JSON.stringify({ verdict: "pass", results }, null, 2)); console.log("Voyage cancellation: 5/5 passed"); })
		.catch((error) => { writeFileSync(resolve(output, "result.json"), JSON.stringify({ verdict: "fail", results, error: error.stack }, null, 2)); console.error(error.stack); process.exitCode = 1; });
}
