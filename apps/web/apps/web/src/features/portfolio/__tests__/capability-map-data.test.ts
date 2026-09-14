import { describe, expect, it } from "vitest";

import {
  CAPABILITY_DOMAINS,
  getCapabilityNode,
} from "../capability-map-data";

describe("capability map data", () => {
  it("defines four domains with six featured and a curated secondary inventory", () => {
    expect(CAPABILITY_DOMAINS).toHaveLength(4);
    expect(CAPABILITY_DOMAINS.every((domain) => domain.nodes.length >= 6)).toBe(
      true,
    );
    expect(
      CAPABILITY_DOMAINS.every(
        (domain) => domain.nodes.filter((node) => node.featured).length === 6,
      ),
    ).toBe(true);

    const nodes = CAPABILITY_DOMAINS.flatMap((domain) => domain.nodes);
		expect(nodes).toHaveLength(43);
		expect(new Set(nodes.map((node) => node.id)).size).toBe(nodes.length);
		expect(
			nodes.every(
				(node) =>
					node.iconSlug.length > 0 &&
					node.projectIds.length > 0 &&
          node.evidence.length > 0 &&
          node.summary.length > 0 &&
          node.plainLanguage.length > 0 &&
          node.interviewAngle.length > 0,
      ),
    ).toBe(true);

    expect(CAPABILITY_DOMAINS.map((domain) => domain.title)).toEqual([
      "AI / Agent",
      "Full Stack / Data",
      "Cloud / Reliability",
      "Trust / Auth",
    ]);
  });

  it("finds a technology by its stable id", () => {
    expect(getCapabilityNode("qwen3-qlora")?.label).toBe("Qwen3 / QLoRA");
    expect(getCapabilityNode("missing-node")).toBeUndefined();
  });
});
