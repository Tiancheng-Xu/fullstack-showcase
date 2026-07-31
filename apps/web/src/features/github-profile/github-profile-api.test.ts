import { describe, expect, it, vi } from "vitest";
import { createGitHubProfileApi, ProfileApiError } from "./github-profile-api";

const profile = {
	githubId: 42,
	login: "Tiancheng-Xu",
	displayName: "Tiancheng Xu",
	bio: null,
	avatarUrl: "https://avatars.githubusercontent.com/u/42?v=4",
	profileUrl: "https://github.com/Tiancheng-Xu",
	publicRepos: 3,
	followers: 2,
	githubCreatedAt: "2020-01-01T00:00:00Z",
	syncedAt: "2026-07-31T12:00:00.000Z",
};

describe("GitHub profile browser API", () => {
	it("maps the saved-profile not-found response to null", async () => {
		const fetchFn = vi.fn(async () =>
			Response.json(
				{
					error: {
						code: "PROFILE_NOT_FOUND",
						message: "No profile has been saved.",
					},
				},
				{ status: 404 },
			),
		);

		await expect(
			createGitHubProfileApi(fetchFn).readSaved(),
		).resolves.toBeNull();
	});

	it("sends only reviewed fields when saving", async () => {
		const fetchFn = vi.fn(async () => Response.json(profile));
		const api = createGitHubProfileApi(fetchFn);

		await api.save({ displayName: "Edited", bio: "Edited bio" });

		expect(fetchFn).toHaveBeenCalledWith("/api/github-profile", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ displayName: "Edited", bio: "Edited bio" }),
		});
	});

	it("converts malformed success data to a safe typed error", async () => {
		const fetchFn = vi.fn(async () => Response.json({ id: "wrong" }));
		const error = await createGitHubProfileApi(fetchFn)
			.readFromGitHub()
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(ProfileApiError);
		expect(error).toMatchObject({
			code: "INVALID_RESPONSE",
			message: "服务器返回了无法识别的数据。",
		});
	});
});
