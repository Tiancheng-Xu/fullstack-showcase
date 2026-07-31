import { describe, expect, it, vi } from "vitest";
import { AppError } from "../errors/app-error";
import { createGitHubProfileClient } from "./github-client";

const upstreamProfile = {
	id: 42,
	login: "Tiancheng-Xu",
	name: "Tiancheng Xu",
	bio: null,
	avatar_url: "https://avatars.githubusercontent.com/u/42?v=4",
	html_url: "https://github.com/Tiancheng-Xu",
	public_repos: 3,
	followers: 2,
	created_at: "2020-01-01T00:00:00Z",
	email: "must-not-leak@example.test",
};

function createClient(fetchFn: typeof fetch, token = "test-token") {
	return createGitHubProfileClient({
		tokenProvider: { getToken: async () => token || undefined },
		fetchFn,
		now: () => new Date("2026-07-31T12:00:00Z"),
		timeoutMs: 5000,
	});
}

async function expectAppError(
	promise: Promise<unknown>,
	expected: { status: number; code: string },
) {
	const error = await promise.catch((caught: unknown) => caught);
	expect(error).toBeInstanceOf(AppError);
	expect(error).toMatchObject(expected);
	expect(JSON.stringify((error as AppError).toResponseBody())).not.toContain(
		"test-token",
	);
}

describe("GitHub profile client", () => {
	it("maps only the whitelisted authenticated profile", async () => {
		const fetchFn = vi.fn(async () =>
			Response.json(upstreamProfile, { status: 200 }),
		);
		const client = createClient(fetchFn);

		const result = await client.fetchAuthenticatedProfile();

		expect(fetchFn).toHaveBeenCalledOnce();
		expect(fetchFn).toHaveBeenCalledWith(
			"https://api.github.com/user",
			expect.objectContaining({
				headers: {
					Accept: "application/vnd.github+json",
					Authorization: "Bearer test-token",
					"User-Agent": "course-homework-github-profile",
					"X-GitHub-Api-Version": "2026-03-10",
				},
				signal: expect.any(AbortSignal),
			}),
		);
		expect(result).not.toHaveProperty("email");
		expect(result).toMatchObject({
			githubId: 42,
			login: "Tiancheng-Xu",
			publicRepos: 3,
			syncedAt: "2026-07-31T12:00:00.000Z",
		});
	});

	it("requires a token at request time", async () => {
		const fetchFn = vi.fn<typeof fetch>();
		await expectAppError(
			createClient(fetchFn, "").fetchAuthenticatedProfile(),
			{
				status: 503,
				code: "GITHUB_TOKEN_MISSING",
			},
		);
		expect(fetchFn).not.toHaveBeenCalled();
	});

	it.each([
		[401, {}, 401, "GITHUB_AUTH_FAILED"],
		[403, { "x-ratelimit-remaining": "0" }, 429, "GITHUB_RATE_LIMITED"],
		[403, {}, 403, "GITHUB_FORBIDDEN"],
		[500, {}, 502, "GITHUB_UNAVAILABLE"],
	] as const)(
		"maps GitHub status %s to a safe application error",
		async (upstreamStatus, headers, status, code) => {
			const fetchFn = vi.fn(async () =>
				Response.json(
					{ message: "private upstream response" },
					{ status: upstreamStatus, headers },
				),
			);
			await expectAppError(createClient(fetchFn).fetchAuthenticatedProfile(), {
				status,
				code,
			});
		},
	);

	it("rejects malformed upstream data", async () => {
		const fetchFn = vi.fn(async () =>
			Response.json({ ...upstreamProfile, id: "wrong" }),
		);
		await expectAppError(createClient(fetchFn).fetchAuthenticatedProfile(), {
			status: 502,
			code: "GITHUB_UNAVAILABLE",
		});
	});

	it("rejects invalid upstream JSON", async () => {
		const fetchFn = vi.fn(
			async () =>
				new Response("not-json", {
					status: 200,
					headers: { "content-type": "application/json" },
				}),
		);
		await expectAppError(createClient(fetchFn).fetchAuthenticatedProfile(), {
			status: 502,
			code: "GITHUB_UNAVAILABLE",
		});
	});

	it("maps aborted requests without leaking details", async () => {
		const fetchFn = vi.fn(async () => {
			throw new DOMException("private abort detail", "AbortError");
		});
		await expectAppError(createClient(fetchFn).fetchAuthenticatedProfile(), {
			status: 502,
			code: "GITHUB_UNAVAILABLE",
		});
	});
});
