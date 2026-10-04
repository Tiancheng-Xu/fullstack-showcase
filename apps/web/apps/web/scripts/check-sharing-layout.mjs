import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const require = createRequire(import.meta.url);
const { sharingRoutes, previewOriginFromChecks, inspectSharingLayout, layoutViolations } = require("./sharing-layout-contract.cjs");
const backstopRequire = createRequire(require.resolve("backstopjs"));
const puppeteer = backstopRequire("puppeteer");
const args = process.argv.slice(2);
const value = (flag) => args.includes(flag) ? args[args.indexOf(flag) + 1] : null;
const output = resolve(process.env.VISUAL_ARTIFACT_DIR || "backstop_data/sharing_layout");
mkdirSync(output, { recursive: true });

async function deploymentOrigin() {
  if (value("--origin")) return value("--origin");
  const sha = value("--sha");
  const repository = value("--repo");
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!sha || !repository || !token) throw new Error("Supply --origin or --sha/--repo and a GitHub token");
  if (!/^[a-f0-9]{40}$/i.test(sha) || !/^Tiancheng-Xu\/fullstack-showcase$/.test(repository)) throw new Error("Unexpected deployment identity");
  for (let attempt = 0; attempt < 24; attempt++) {
    const response = await fetch(`https://api.github.com/repos/${repository}/commits/${sha}/check-runs?per_page=100`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`GitHub check lookup failed: HTTP ${response.status}`);
    const payload = await response.json();
    const origin = previewOriginFromChecks(payload.check_runs);
    if (origin) return origin;
    console.log(`Waiting for this commit's Cloudflare preview (${attempt + 1}/24)`);
    await sleep(30_000);
  }
  throw new Error("Cloudflare preview was not ready within 12 minutes; no rebuild requested");
}

const origin = new URL(await deploymentOrigin());
if (origin.protocol !== "https:" || origin.username || origin.password ||
  !(origin.hostname === "baby2b.online" || /^[a-z0-9-]+\.fullstack-showcase\.pages\.dev$/.test(origin.hostname)) ||
  origin.port || origin.pathname !== "/" || origin.search || origin.hash) {
  throw new Error("Visual checks require the production or commit-specific remote Pages origin, never localhost");
}
const executablePath = process.env.BACKSTOP_CHROME_EXECUTABLE || process.env.PUPPETEER_EXECUTABLE_PATH ||
  (process.platform === "darwin" ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" : "/usr/bin/google-chrome");
if (!existsSync(executablePath)) throw new Error(`Chrome executable is unavailable: ${executablePath}`);
const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage", "--lang=zh-CN"] });
const results = [];
try {
  for (const route of sharingRoutes) {
    for (const width of [375, 390, 430, 1440]) {
      const page = await browser.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      try {
        await page.setViewport({ width, height: width < 700 ? 844 : 1100, deviceScaleFactor: 1 });
        await page.emulateTimezone("UTC");
        await page.setExtraHTTPHeaders({ "Accept-Language": "zh-CN" });
        const response = await page.goto(new URL(route, origin).href, { waitUntil: "networkidle0", timeout: 60_000 });
        if (response.status() !== 200) throw new Error(`HTTP ${response.status()}`);
        await page.evaluate(() => document.fonts.ready.then(() => true));
        if (value("--stylesheet")) await page.addStyleTag({ content: readFileSync(resolve(value("--stylesheet")), "utf8") });
        await page.addStyleTag({ content: "*,*::before,*::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }" });
        const report = await inspectSharingLayout(page);
        const failures = [...layoutViolations(report), ...errors.map((error) => `page error: ${error}`)];
        const name = route.slice(1).replaceAll("/", "_") + "-" + width;
        await page.screenshot({ path: resolve(output, name + ".png"), fullPage: report.detail });
        results.push({ route, width, ...report, failures });
        console.log(`${failures.length ? "FAIL" : "PASS"} ${width}px ${route}${failures.length ? ": " + failures.join(", ") : ""}`);
      } catch (error) {
        results.push({ route, width, failures: [error.message] });
        console.log(`FAIL ${width}px ${route}: ${error.message}`);
      } finally {
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}
writeFileSync(resolve(output, "report.json"), JSON.stringify({ origin: origin.origin, projectedStylesheet: !!value("--stylesheet"), results }, null, 2));
const failed = results.filter((result) => result.failures.length);
console.log(`Sharing layout gate: ${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exitCode = 1;
