import assert from "node:assert/strict";
import test from "node:test";

import { isProjectOwnedEvidenceUrl } from "./index.mjs";

test("accepts project-owned Evidence on the production host", () => {
	assert.equal(
		isProjectOwnedEvidenceUrl(
			"https://agent-market.baby2b.online/evidence/",
			"agent-market",
			"https://agent-market.baby2b.online/",
		),
		true,
	);
});

test("accepts Dashboard-owned Evidence with the exact project slug", () => {
	assert.equal(
		isProjectOwnedEvidenceUrl(
			"https://baby2b.online/evidence/tc-workflow",
			"tc-workflow",
			"https://tc-workflow.baby2b.online/",
		),
		true,
	);
});

test("rejects the retired Evidence Hub and mismatched paths", () => {
	for (const url of [
		"https://evidence.baby2b.online/agent-market/",
		"https://baby2b.online/evidence/wrong-project",
		"https://agent-market.baby2b.online/evidence/private",
		"https://other.baby2b.online/evidence/",
	]) {
		assert.equal(
			isProjectOwnedEvidenceUrl(
				url,
				"agent-market",
				"https://agent-market.baby2b.online/",
			),
			false,
			url,
		);
	}
});
