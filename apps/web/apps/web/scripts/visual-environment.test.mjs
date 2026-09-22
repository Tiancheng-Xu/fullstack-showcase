import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

describe("visual regression environment", () => {
	it("pins the reviewed macOS Chrome environment instead of accepting any browser", () => {
		const config = require("../backstop.config.cjs");
		const packageJson = require("../package.json");
		expect(config.visualEnvironment).toEqual({
			browser: "Google Chrome 153.0.8010.50",
			platform: "darwin",
			architecture: "arm64",
			locale: "zh-CN",
			timezone: "UTC",
			deviceScaleFactor: 1,
		});
		expect(packageJson.scripts["visual:reference"]).toContain(
			"BACKSTOP_VALIDATE_REVIEWED_ENVIRONMENT=1",
		);
		expect(packageJson.scripts["visual:test"]).toContain(
			"BACKSTOP_VALIDATE_REVIEWED_ENVIRONMENT=1",
		);
		expect(packageJson.scripts["visual:test"]).toContain(
			"run-visual-regression.mjs test",
		);
		expect(config.scenarios.some(({ url }) => url.includes("/open-source"))).toBe(
			true,
		);
		const runner = readFileSync(
			`${process.cwd()}/scripts/run-visual-regression.mjs`,
			"utf8",
		);
		expect(runner).toContain('"4184"');
		expect(runner).toContain("BACKSTOP_VALIDATE_REVIEWED_ENVIRONMENT");
		const stylesheet = readFileSync(
			`${process.cwd()}/src/index.css`,
			"utf8",
		);
		expect(stylesheet).toContain("grid-template-columns: minmax(7.5rem, 0.58fr) minmax(12rem, 1.7fr);");
		expect(stylesheet).toContain("grid-column: 1 / -1;");
		const voyageScene = readFileSync(
			`${process.cwd()}/src/features/portfolio/portfolio-voyage-scene.ts`,
			"utf8",
		);
		const voyageHero = readFileSync(
			`${process.cwd()}/src/features/portfolio/portfolio-voyage-hero.tsx`,
			"utf8",
		);
		const voyageStyles = readFileSync(
			`${process.cwd()}/src/features/portfolio/portfolio-voyage-hero.css`,
			"utf8",
		);
		expect(voyageScene).toContain("onTwosComplementScreenPosition");
		expect(voyageScene).toContain("projectNode(twosComplementSun.plane)");
		expect(voyageHero).toContain("onTwosComplementScreenPosition:");
		expect(voyageHero).toContain("--voyage-twos-x");
		expect(voyageStyles).toContain("top: var(--voyage-twos-y, 27%);");
		expect(voyageStyles).toContain("left: var(--voyage-twos-x, 67%);");
		const importWithoutVisualExecution = spawnSync(
			process.execPath,
			["-e", 'require("./backstop.config.cjs")'],
			{
				cwd: process.cwd(),
				env: {
					...process.env,
					BACKSTOP_CHROME_EXECUTABLE: "/unavailable/reviewed-chrome",
					BACKSTOP_VALIDATE_REVIEWED_ENVIRONMENT: "0",
				},
				encoding: "utf8",
			},
		);
		expect(importWithoutVisualExecution.status).toBe(0);
	});
});
