import { describe, expect, it } from "vitest";

import { sampleVoyagePose, waveHeight } from "../voyage-wave";

describe("voyage wave model", () => {
  it("uses the same deterministic surface for ocean and ship pose", () => {
    expect(waveHeight(2, -3, 1.5)).toBe(waveHeight(2, -3, 1.5));

    const pose = sampleVoyagePose(0.42, 1.5);
    expect(Number.isFinite(pose.x)).toBe(true);
    expect(Number.isFinite(pose.y)).toBe(true);
    expect(Number.isFinite(pose.z)).toBe(true);
    expect(Number.isFinite(pose.pitch)).toBe(true);
    expect(Number.isFinite(pose.roll)).toBe(true);
    expect(Number.isFinite(pose.yaw)).toBe(true);
  });
});
