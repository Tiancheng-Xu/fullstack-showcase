import { describe, expect, it, vi } from "vitest";
import { createApp } from "./app";
import type { GitHubProfile } from "./contracts/github-profile";
import type { ProfileRepository } from "./db/profile-repository";
import { AppError } from "./errors/app-error";
import type { GitHubProfileSource } from "./github/github-client";

const githubProfile: GitHubProfile = {
	githubId: 42,
	login: "Tiancheng-Xu",
	displayName: "GitHub Name",
	bio: "GitHub bio",
	avatarUrl: "https://avatars.githubusercontent.com/u/42?v=4",
	profileUrl: "https://github.com/Tiancheng-Xu",
	publicRepos: 3,
	followers: 2,
	githubCreatedAt: "2020-01-01T00:00:00Z",
	syncedAt: "2026-07-31T12:00:00.000Z",
};

function dependencies(options?: {
	github?: GitHubProfileSource;
	profiles?: ProfileRepository;
}) {
	return {
		github:
			options?.github ??
			({
				fetchAuthenticatedProfile: vi.fn(async () => githubProfile),
			} satisfies GitHubProfileSource),
		profiles:
			options?.profiles ??
			({
				findLatest: vi.fn(async () => githubProfile),
				upsert: vi.fn(async (profile) => profile),
			} satisfies ProfileRepository),
	};
}

describe("GitHub profile Hono API", () => {
	it("reports health", async () => {
		const response = await createApp(dependencies()).request("/health");
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ status: "ok" });
	});

	it("reads the authenticated GitHub profile", async () => {
		const response = await createApp(dependencies()).request("/api/github/me");
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual(githubProfile);
	});

	it("rejects immutable fields in the save body", async () => {
		const response = await createApp(dependencies()).request(
			"/api/github-profile",
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					displayName: "Edited",
					bio: "Edited bio",
					githubId: 999,
				}),
			},
		);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: {
				code: "VALIDATION_FAILED",
				message: "The submitted profile fields are invalid.",
			},
		});
	});

	it("re-fetches immutable values and saves only reviewed fields", async () => {
		const deps = dependencies();
		const response = await createApp(deps).request("/api/github-profile", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ displayName: "Edited", bio: "Edited bio" }),
		});

		expect(deps.github.fetchAuthenticatedProfile).toHaveBeenCalledOnce();
		expect(deps.profiles.upsert).toHaveBeenCalledWith({
			...githubProfile,
			displayName: "Edited",
			bio: "Edited bio",
		});
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			githubId: 42,
			displayName: "Edited",
			bio: "Edited bio",
		});
	});

	it("returns not found when no profile has been saved", async () => {
		const deps = dependencies({
			profiles: {
				findLatest: vi.fn(async () => null),
				upsert: vi.fn(async (profile) => profile),
			},
		});
		const response = await createApp(deps).request("/api/github-profile");

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({
			error: {
				code: "PROFILE_NOT_FOUND",
				message: "No GitHub profile has been saved yet.",
			},
		});
	});

	it("returns saved profile data", async () => {
		const response = await createApp(dependencies()).request(
			"/api/github-profile",
		);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual(githubProfile);
	});

	it("serializes AppError without its cause", async () => {
		const response = await createApp(
			dependencies({
				github: {
					fetchAuthenticatedProfile: vi.fn(async () => {
						throw new AppError({
							status: 503,
							code: "GITHUB_TOKEN_MISSING",
							safeMessage: "GitHub credential has not been saved yet.",
							cause: new Error("private cause"),
						});
					}),
				},
			}),
		).request("/api/github/me");

		expect(response.status).toBe(503);
		expect(await response.json()).toEqual({
			error: {
				code: "GITHUB_TOKEN_MISSING",
				message: "GitHub credential has not been saved yet.",
			},
		});
	});

	it("hides unexpected internal details", async () => {
		const response = await createApp(
			dependencies({
				profiles: {
					findLatest: vi.fn(async () => {
						throw new Error("private SQL and stack detail");
					}),
					upsert: vi.fn(async (profile) => profile),
				},
			}),
		).request("/api/github-profile");

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({
			error: {
				code: "INTERNAL_ERROR",
				message: "The request could not be completed.",
			},
		});
	});
});
