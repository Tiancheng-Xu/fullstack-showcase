import { describe, expect, it } from "vitest";

import { createTechnologyParticleLayout } from "../technology-particle-layout";

describe("createTechnologyParticleLayout", () => {
	it("creates one stable 3D position for every capability node", () => {
		const layout = createTechnologyParticleLayout(24);

		expect(layout).toHaveLength(24);
		expect(new Set(layout.map(({ x, y, z }) => `${x}:${y}:${z}`)).size).toBe(24);
		expect(layout.some(({ z }) => Math.abs(z) > 1)).toBe(true);
		expect(createTechnologyParticleLayout(24)).toEqual(layout);
	});

	it("places capabilities on two expanding multi-turn spiral arms", () => {
		const layout = createTechnologyParticleLayout(24);
		const flattenedRadius = ({ x, y }: (typeof layout)[number]) =>
			Math.hypot(x, y / 0.58);

		for (let arm = 0; arm < 2; arm += 1) {
			const radii = layout.filter((_, index) => index % 2 === arm).map(flattenedRadius);
			expect(radii.every((radius, index) => index === 0 || radius > radii[index - 1])).toBe(true);
		}

		const firstTurnAngles = layout.slice(0, 2).map(({ x, y }) => Math.atan2(y / 0.58, x));
		const angleGap = (from: number, to: number) => (to - from + Math.PI * 2) % (Math.PI * 2);
		expect(angleGap(firstTurnAngles[0], firstTurnAngles[1])).toBeCloseTo(Math.PI, 2);

		const innerRadius = Math.max(...layout.slice(0, 2).map(flattenedRadius));
		const outerRadius = Math.min(...layout.slice(-2).map(flattenedRadius));
		expect(outerRadius).toBeGreaterThan(innerRadius * 2.5);
	});

	it("distributes icon nodes through genuine scene depth", () => {
		const depths = createTechnologyParticleLayout(24).map(({ z }) => z);
		expect(Math.max(...depths) - Math.min(...depths)).toBeGreaterThan(8);
	});
});
