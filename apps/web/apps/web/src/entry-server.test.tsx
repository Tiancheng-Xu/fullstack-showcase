import { describe, expect, it } from "vitest";
import { renderDashboardRoute } from "./entry-server";

describe("static-first Dashboard", () => {
	it("renders the Dashboard route as readable HTML", async () => {
		const result = await renderDashboardRoute("/dashboard");
		expect(result.markup).toContain("Showcase Dashboard");
		expect(result.markup).toContain("Portfolio Sync");
		expect(result.markup).toContain("查看完整工作证明");
		expect(result.hydrationHtml).toContain("$_TSR");
	});
});
