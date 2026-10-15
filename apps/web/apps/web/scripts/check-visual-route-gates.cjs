const { createRequire } = require("node:module");
const backstopRequire = createRequire(require.resolve("backstopjs/package.json"));
const puppeteer = backstopRequire("puppeteer");
const config = require("../backstop.config.cjs");
const before = require("../backstop_data/engine_scripts/puppet/onBefore.cjs");
const ready = require("../backstop_data/engine_scripts/puppet/onReady.cjs");

// Backstop logs hook exceptions without necessarily failing image comparison.
// Execute the same hooks separately and propagate every rejection to the runner.
async function run() {
	const browser = await puppeteer.launch({ ...config.engineOptions, headless: true });
	let count = 0;
	try {
		for (const scenario of config.scenarios) {
			for (const viewport of scenario.viewports || config.viewports) {
				const page = await browser.newPage();
				try {
					await page.setCacheEnabled(false);
					await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: config.visualEnvironment.deviceScaleFactor });
					await before(page);
					const response = await page.goto(scenario.url, { waitUntil: "networkidle0", timeout: 30000 });
					if (response.status() !== 200) throw new Error(`${scenario.label}: HTTP ${response.status()}`);
					await ready(page);
					count += 1;
				} finally { await page.close(); }
			}
		}
	} finally { await browser.close(); }
	console.log(`Visual route preflight: ${count}/${count} passed`);
}

run().catch((error) => {
	console.error(error.message);
	process.exitCode = 1;
});
