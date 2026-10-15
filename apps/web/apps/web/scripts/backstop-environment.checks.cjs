const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { test } = require("node:test");
const { createHash } = require("node:crypto");

test("pins software rasterization and preserves the separate software baseline", () => {
	const config = require("../backstop.config.cjs");
	assert.ok(config.engineOptions.args.includes("--disable-gpu"));
	assert.ok(config.paths.bitmaps_reference.includes("chrome155-darwin-arm64-software"));
});
const { runInNewContext } = require("node:vm");

const source = readFileSync(resolve(__dirname, "../backstop.config.cjs"), "utf8");

function loadConfig(overrides = {}) {
	const values = {
		browser: "Google Chrome 155.0.8059.40",
		platform: "darwin",
		architecture: "arm64",
		exists: true,
		...overrides,
	};
	const modules = {
		"node:child_process": { execFileSync: () => values.browser },
		"node:fs": { existsSync: () => values.exists },
		"node:os": {
			arch: () => values.architecture,
			platform: () => values.platform,
		},
	};
	const context = {
		module: { exports: {} },
		process: {
			env: {
				BACKSTOP_VALIDATE_REVIEWED_ENVIRONMENT: "1",
				BACKSTOP_CHROME_EXECUTABLE: "/isolated/chrome",
			},
		},
		require(name) {
			assert.ok(Object.hasOwn(modules, name), `Unexpected import: ${name}`);
			return modules[name];
		},
	};
	runInNewContext(source, context, { timeout: 1000 });
	return context.module.exports;
}

test("accepts only the pinned reviewed Chrome build", () => {
	assert.equal(loadConfig().engineOptions.executablePath, "/isolated/chrome");
	for (const browser of ["Google Chrome 153.0.8010.50", "Google Chrome 155.0.8059.41", "Chromium 155.0.8059.40"]) {
		assert.throws(() => loadConfig({ browser }), /Visual environment mismatch/);
	}
});

test("rejects a different platform or architecture", () => {
	assert.throws(() => loadConfig({ platform: "linux" }), /Visual environment mismatch/);
	assert.throws(() => loadConfig({ architecture: "x64" }), /Visual environment mismatch/);
});

test("rejects an unavailable browser executable", () => {
	assert.throws(() => loadConfig({ exists: false }), /Reviewed Chrome executable is unavailable/);
});

test("preserves the rendering contract and mismatch threshold", () => {
	const config = loadConfig();
	assert.equal(config.visualEnvironment.locale, "zh-CN");
	assert.equal(config.visualEnvironment.timezone, "UTC");
	assert.equal(config.visualEnvironment.deviceScaleFactor, 1);
	assert.ok(config.scenarios.every((scenario) => scenario.misMatchThreshold === 0.1 && scenario.requireSameDimensions));
});

test("uses the explicitly adopted content revision separately from both old baselines", () => {
	assert.equal(loadConfig().paths.bitmaps_reference, "backstop_data/baselines/chrome155-darwin-arm64-software-content-20261015/bitmaps_reference");
});

test("preserves all sixty original reference PNG hashes", () => {
	const receipt = JSON.parse(readFileSync(resolve(__dirname, "../backstop_data/baselines/chrome155-darwin-arm64-software-content-20261015/acceptance.json"), "utf8"));
	assert.equal(receipt.protectedOriginalReferences.length, 60);
	for (const reference of receipt.protectedOriginalReferences) {
		const bytes = readFileSync(resolve(__dirname, "..", reference.file));
		assert.equal(createHash("sha256").update(bytes).digest("hex"), reference.sha256, reference.file);
	}
});

test("adopts exactly ten reviewed candidates and carries forward twenty-eight references", () => {
	const receipt = JSON.parse(readFileSync(resolve(__dirname, "../backstop_data/baselines/chrome155-darwin-arm64-software-content-20261015/acceptance.json"), "utf8"));
	assert.equal(receipt.references.length, 38);
	assert.equal(receipt.references.filter((entry) => entry.origin === "reviewed-candidate").length, 10);
	assert.equal(receipt.references.filter((entry) => entry.origin === "carried-forward").length, 28);
	assert.equal(receipt.humanApproval.adopted, true);
	assert.equal(receipt.thresholdPercent, 0.1);
	assert.equal(receipt.requireSameDimensions, true);
	for (const reference of receipt.references) {
		const bytes = readFileSync(resolve(__dirname, "..", loadConfig().paths.bitmaps_reference, reference.file));
		assert.equal(createHash("sha256").update(bytes).digest("hex"), reference.sha256, reference.file);
	}
});

test("covers sharing and long-title notes at desktop and mobile widths", () => {
	const config = loadConfig();
	for (const label of ["sharing", "ai-conferences", "ai-conference-note", "sharing-note"]) {
		assert.ok(config.scenarios.some((scenario) => scenario.label === label));
	}
	assert.equal(config.scenarios.reduce((count, scenario) => count + (scenario.viewports || config.viewports).length, 0), 38);
});
