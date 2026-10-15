const { execFileSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const { arch, platform } = require("node:os");

const macChrome =
	"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const visualEnvironment = {
	browser: "Google Chrome 155.0.8059.40",
	platform: "darwin",
	architecture: "arm64",
	locale: "zh-CN",
	timezone: "UTC",
	deviceScaleFactor: 1,
};
const chromeExecutable = process.env.BACKSTOP_CHROME_EXECUTABLE || macChrome;

const validateReviewedEnvironment = () => {
	if (!existsSync(chromeExecutable)) {
		throw new Error(
			`Reviewed Chrome executable is unavailable: ${chromeExecutable}`,
		);
	}
	const actualBrowser = execFileSync(chromeExecutable, ["--version"], {
		encoding: "utf8",
	}).trim();
	if (
		actualBrowser !== visualEnvironment.browser ||
		platform() !== visualEnvironment.platform ||
		arch() !== visualEnvironment.architecture
	) {
		throw new Error(
			`Visual environment mismatch: ${JSON.stringify({ actualBrowser, platform: platform(), architecture: arch() })}`,
		);
	}
};

if (process.env.BACKSTOP_VALIDATE_REVIEWED_ENVIRONMENT === "1") {
	validateReviewedEnvironment();
}
process.env.TZ = visualEnvironment.timezone;

const viewports = [375, 390, 430, 1440].map((width) => ({
	label: `${width}px`,
	width,
	height: width < 768 ? 844 : 1100,
}));

const routes = [
	["dashboard", "/dashboard"],
	["projects", "/projects"],
	["evidence", "/evidence"],
	["open-source", "/open-source"],
	["performance-control", "/performance-control/babysteps"],
	["sharing", "/sharing"],
	["ai-conferences", "/ai-conferences"],
	["ai-conference-note", "/ai-conference-notes/yunqi-2026"],
	["sharing-note", "/sharing-notes/overreacted/what-is-javascript-made-of"],
];

module.exports = {
	id: "fullstack_showcase_portfolio",
	visualEnvironment,
	viewports,
	scenarios: routes.map(([label, route]) => ({
		label,
		url: `http://127.0.0.1:4184${route}?visual=local-reviewed`,
		selectors: ["document"],
		selectorExpansion: true,
		misMatchThreshold: 0.1,
		requireSameDimensions: true,
		delay: 250,
		onBeforeScript: "puppet/onBefore.cjs",
		onReadyScript: "puppet/onReady.cjs",
	})).concat({
		label: "dashboard-resume-desktop",
		url: "http://127.0.0.1:4184/dashboard?visual=local-reviewed",
		viewports: [1440, 1536].map((width) => ({
			label: `${width}px`, width, height: 1100,
		})),
		selectors: ["#skills > .portfolio-dashboard-module-card"],
		selectorExpansion: true,
		misMatchThreshold: 0.1,
		requireSameDimensions: true,
		delay: 250,
		onBeforeScript: "puppet/onBefore.cjs",
		onReadyScript: "puppet/onReady.cjs",
	}),
	paths: {
		bitmaps_reference: "backstop_data/baselines/chrome155-darwin-arm64-software-content-20261015/bitmaps_reference",
		bitmaps_test: "backstop_data/baselines/chrome155-darwin-arm64-software-content-20261015/bitmaps_test",
		engine_scripts: "backstop_data/engine_scripts",
		html_report: "backstop_data/baselines/chrome155-darwin-arm64-software-content-20261015/html_report",
		ci_report: "backstop_data/baselines/chrome155-darwin-arm64-software-content-20261015/ci_report",
	},
	report: ["CI"],
	engine: "puppeteer",
	engineOptions: {
		args: ["--disable-dev-shm-usage", "--lang=zh-CN", "--no-sandbox", "--disable-gpu"],
		executablePath: chromeExecutable,
	},
	asyncCaptureLimit: 1,
	asyncCompareLimit: 4,
	debug: false,
	debugWindow: false,
};
