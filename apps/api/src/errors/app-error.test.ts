import { describe, expect, it } from "vitest";
import { AppError } from "./app-error";

describe("AppError", () => {
	it("serializes only a stable safe response", () => {
		const error = new AppError({
			status: 503,
			code: "UPSTREAM_UNAVAILABLE",
			safeMessage: "GitHub is temporarily unavailable.",
			cause: new Error("private upstream detail"),
		});

		expect(error.toResponseBody()).toEqual({
			error: {
				code: "UPSTREAM_UNAVAILABLE",
				message: "GitHub is temporarily unavailable.",
			},
		});
		expect(Object.keys(error)).not.toContain("cause");
	});
});
