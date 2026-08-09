import type { execFile } from "node:child_process";
import { describe, expect, it, vi } from "vitest";
import { AppError } from "../errors/app-error";
import { createMacOSKeychainTokenProvider } from "./keychain-token-provider";

const options = {
	service: "course-homework.github-profile",
	account: "Tiancheng-Xu",
};

describe("macOS Keychain token provider", () => {
	it("reads and trims the generic password", async () => {
		const execFileFn = vi.fn((file, args, execOptions, callback) => {
			expect(file).toBe("/usr/bin/security");
			expect(args).toEqual([
				"find-generic-password",
				"-s",
				options.service,
				"-a",
				options.account,
				"-w",
			]);
			expect(execOptions).toMatchObject({ encoding: "utf8", maxBuffer: 4096 });
			callback(null, "test-token\n", "");
		});

		const provider = createMacOSKeychainTokenProvider({
			...options,
			execFileFn: execFileFn as unknown as typeof execFile,
		});

		await expect(provider.getToken()).resolves.toBe("test-token");
	});

	it("returns undefined when the item does not exist", async () => {
		const execFileFn = vi.fn((_file, _args, _options, callback) => {
			callback(Object.assign(new Error("item missing"), { code: 44 }), "", "");
		});
		const provider = createMacOSKeychainTokenProvider({
			...options,
			execFileFn: execFileFn as unknown as typeof execFile,
		});

		await expect(provider.getToken()).resolves.toBeUndefined();
	});

	it("maps other failures to a safe unavailable error", async () => {
		const execFileFn = vi.fn((_file, _args, _options, callback) => {
			callback(
				Object.assign(new Error("private failure"), { code: 1 }),
				"secret stdout",
				"private stderr",
			);
		});
		const provider = createMacOSKeychainTokenProvider({
			...options,
			execFileFn: execFileFn as unknown as typeof execFile,
		});

		const error = await provider.getToken().catch((caught: unknown) => caught);
		expect(error).toBeInstanceOf(AppError);
		expect(error).toMatchObject({
			status: 503,
			code: "GITHUB_CREDENTIAL_UNAVAILABLE",
		});
		expect(JSON.stringify((error as AppError).toResponseBody())).not.toMatch(
			/private|secret|stderr|security/,
		);
	});
});
