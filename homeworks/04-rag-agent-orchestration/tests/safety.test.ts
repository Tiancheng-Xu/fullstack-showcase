import { describe, expect, it } from "vitest";
import { deduplicateByHash } from "../src/corpus/deduplicate.js";
import { scanOutboundText } from "../src/corpus/safety.js";

describe("outbound safety", () => {
	it("keeps the lexicographically first canonical path per exact content hash", () => {
		const result = deduplicateByHash([
			{ relativePath: "b.md", contentSha256: "same" },
			{ relativePath: "a.md", contentSha256: "same" },
			{ relativePath: "c.md", contentSha256: "other" },
		]);
		expect(result.canonicalPaths).toEqual(["a.md", "c.md"]);
		expect(result.duplicates).toEqual([
			{ canonicalPath: "a.md", duplicatePath: "b.md" },
		]);
	});

	it("reports categories and offsets without echoing credential values", () => {
		const input = "api_key=sk-example-secret-value";
		const findings = scanOutboundText(input);
		expect(findings).toEqual([
			{ category: "api-key", start: 0, end: input.length },
		]);
		expect(JSON.stringify(findings)).not.toContain("sk-example-secret-value");
	});

	it("detects private keys, passwords, phone numbers and email addresses", () => {
		const input = [
			"-----BEGIN PRIVATE KEY-----",
			"password = example-passphrase",
			"phone: 13800138000",
			"mail: learner@example.com",
		].join("\n");
		expect(scanOutboundText(input).map((finding) => finding.category)).toEqual([
			"private-key",
			"password",
			"phone",
			"email",
		]);
	});
});
