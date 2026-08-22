import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardContent } from "../dashboard-content";

describe("dashboard rendering tags", () => {
	it("merges rendering modes into the original project tag list", () => {
		const html = renderToStaticMarkup(<DashboardContent />);

		expect(html).not.toContain(">RENDERING</legend>");
		expect(html).toContain(">Edge SSR</span>");
		expect(html).toContain(">Hydration</span>");
		expect(html).toContain(">CSR</span>");
	});
});
