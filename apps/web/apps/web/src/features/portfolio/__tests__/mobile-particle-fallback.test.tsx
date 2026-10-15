import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TechnologyCapabilityMap } from "../technology-capability-map";
import { TechnologyParticleBackdrop } from "../technology-particle-backdrop";

describe("mobile particle fallback", () => {
	for (const [name, Component] of [["capability map", TechnologyCapabilityMap], ["repository backdrop", TechnologyParticleBackdrop]] as const) {
		it("keeps the " + name + " static without a WebGL probe", () => {
			const width = window.innerWidth;
			const context = vi.spyOn(HTMLCanvasElement.prototype, "getContext");
			Object.defineProperty(window, "innerWidth", { configurable: true, value: 400 });
			try {
				const { container, unmount } = render(<Component />);
				expect(container.querySelector("canvas")).not.toBeNull();
				expect(context.mock.calls.filter(([kind]) => /^(webgl|webgl2|experimental-webgl)$/i.test(kind))).toEqual([]);
				unmount();
			} finally {
				Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
				context.mockRestore();
			}
		});
	}
});
