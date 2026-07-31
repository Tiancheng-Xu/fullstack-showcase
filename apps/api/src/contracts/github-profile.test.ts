import { describe, expect, it } from "vitest";
import {
	githubProfileSchema,
	saveGitHubProfileInputSchema,
} from "./github-profile";

describe("GitHub profile contracts", () => {
	it("accepts the whitelisted GitHub profile", () => {
		expect(
			githubProfileSchema.parse({
				githubId: 42,
				login: "Tiancheng-Xu",
				displayName: "Tiancheng Xu",
				bio: null,
				avatarUrl: "https://avatars.githubusercontent.com/u/42?v=4",
				profileUrl: "https://github.com/Tiancheng-Xu",
				publicRepos: 3,
				followers: 2,
				githubCreatedAt: "2020-01-01T00:00:00Z",
				syncedAt: "2026-07-31T12:00:00Z",
			}),
		).toMatchObject({ githubId: 42, login: "Tiancheng-Xu" });
	});

	it("rejects immutable GitHub fields in the save body", () => {
		expect(() =>
			saveGitHubProfileInputSchema.parse({
				displayName: "Edited name",
				bio: "Edited bio",
				githubId: 999,
			}),
		).toThrow();
	});
});
