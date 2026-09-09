import { describe, expect, it } from "vitest";

import {
	advanceVoyageReadiness,
	getVoyageDevicePixelRatio,
  shouldEnableVoyageScene,
} from "../voyage-scene-policy";

describe("voyage scene policy", () => {
  it("uses the static fallback for reduced motion, missing WebGL, and mobile", () => {
    expect(
      shouldEnableVoyageScene({
        reducedMotion: true,
        viewportWidth: 1440,
        webglAvailable: true,
      }),
    ).toBe(false);
    expect(
      shouldEnableVoyageScene({
        reducedMotion: false,
        viewportWidth: 1440,
        webglAvailable: false,
      }),
    ).toBe(false);
    expect(
      shouldEnableVoyageScene({
        reducedMotion: false,
        viewportWidth: 390,
        webglAvailable: true,
      }),
    ).toBe(false);
  });

	it("caps expensive rendering on high-density displays", () => {
    expect(getVoyageDevicePixelRatio(1440, 2)).toBe(1.5);
    expect(getVoyageDevicePixelRatio(390, 3)).toBe(1);
	});

	it("requires three consecutive ready frames before revealing the scene", () => {
		expect(advanceVoyageReadiness(0, true)).toEqual({ frames: 1, ready: false });
		expect(advanceVoyageReadiness(2, true)).toEqual({ frames: 3, ready: true });
		expect(advanceVoyageReadiness(2, false)).toEqual({ frames: 0, ready: false });
	});
});
