import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("motion/react", async (importOriginal) => {
	const actual = await importOriginal<typeof import("motion/react")>();
	return {
		...actual,
		useReducedMotion: () => true,
	};
});

import { DashboardScrollProgress } from "../dashboard-scroll-progress";

describe("DashboardScrollProgress", () => {
	it("does not subscribe or render motion when reduced motion is requested", () => {
		const { container } = render(<DashboardScrollProgress />);
		const progress = container.querySelector(
			'[data-dashboard-scroll-progress="true"]',
		);

		expect(progress).toBeNull();
	});
});
