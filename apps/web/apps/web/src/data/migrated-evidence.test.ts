import { describe, expect, it } from "vitest";

import { getMigratedEvidence } from "./migrated-evidence";

describe("migrated Evidence contracts", () => {
	for (const projectId of [
		"github-profile-studio",
		"portfolio-sync",
		"tc-workflow",
	]) {
		it(`keeps the complete ${projectId} source narrative`, () => {
			const document = getMigratedEvidence(projectId);
			expect(document).toBeDefined();
			expect(document?.scope).toBeTruthy();
			expect(document?.model).toBeTruthy();
			expect(Object.keys(document?.metrics ?? {})).not.toHaveLength(0);
			expect(document?.promotionItems.length).toBeGreaterThan(0);
			expect(document?.story.terms.length).toBeGreaterThan(0);
			expect(document?.meaningfulSteps.length).toBeGreaterThan(0);
			expect(Object.keys(document?.architecture ?? {})).not.toHaveLength(0);
			expect(document?.diagrams.length).toBeGreaterThan(0);
			expect(document?.incidents.length).toBeGreaterThan(0);
			expect(document?.proof.length).toBeGreaterThan(0);
			expect(document?.assets.length).toBeGreaterThan(0);
			expect(document?.limitations.length).toBeGreaterThan(0);
		});
	}
});
