import { describe, expect, it } from "vitest";

import { verifyTotpCode } from "../totp";

describe("TOTP verification", () => {
	it("accepts the RFC 6238 SHA-1 vector at the matching time step", async () => {
		expect(
			await verifyTotpCode(
				"GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
				"94287082",
				59_000,
				{ digits: 8, window: 0 },
			),
		).toBe(true);
	});

	it("accepts one adjacent 30-second window and rejects malformed codes", async () => {
		const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
		expect(
			await verifyTotpCode(secret, "94287082", 89_000, {
				digits: 8,
				window: 1,
			}),
		).toBe(true);
		expect(await verifyTotpCode(secret, "12ab", 59_000)).toBe(false);
		expect(await verifyTotpCode("not-base32", "123456", 59_000)).toBe(false);
	});
});
