import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

describe("visual regression environment", () => {
	it("pins the reviewed macOS Chrome environment instead of accepting any browser", () => {
		const config = require("../backstop.config.cjs");
		expect(config.visualEnvironment).toEqual({
			browser: "Google Chrome 152.0.7977.77",
			platform: "darwin",
			architecture: "arm64",
			locale: "zh-CN",
			timezone: "UTC",
			deviceScaleFactor: 1,
		});
	});
});
