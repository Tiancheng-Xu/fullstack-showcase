import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
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
