import { describe, expect, it } from "vitest";
import { readServerEnv } from "./env";

describe("server environment", () => {
	it("uses non-secret local defaults", () => {
		expect(readServerEnv({})).toEqual({
			KEYCHAIN_SERVICE: "course-homework.github-profile",
			KEYCHAIN_ACCOUNT: "Tiancheng-Xu",
			DB_FILE_NAME: "./data/github-profile.sqlite",
			PORT: 3000,
		});
	});

	it("rejects an invalid port", () => {
		expect(() => readServerEnv({ PORT: "70000" })).toThrow();
	});
});
