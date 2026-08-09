import { describe, expect, it } from "vitest";
import { assertBundleEntries } from "../src/bundle/verify.js";

describe("remote bundle", () => {
	it("accepts allowlisted training files and rejects notes, git data and credentials", () => {
		expect(() =>
			assertBundleEntries(["training/preflight.py", "data/train.jsonl"]),
		).not.toThrow();
		expect(() => assertBundleEntries(["一灯学习笔记/课程总结.md"])).toThrow(
			/allowlist/,
		);
		expect(() => assertBundleEntries([".git/config"])).toThrow(/allowlist/);
		expect(() => assertBundleEntries([".env"])).toThrow(/allowlist/);
		expect(() => assertBundleEntries(["../data/train.jsonl"])).toThrow(
			/allowlist/,
		);
	});
});
