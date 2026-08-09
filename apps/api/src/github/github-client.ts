import { z } from "zod";
import type { GitHubTokenProvider } from "../auth/keychain-token-provider";
import {
	type GitHubProfile,
	githubProfileSchema,
} from "../contracts/github-profile";
import { AppError } from "../errors/app-error";

const upstreamProfileSchema = z.object({
	id: z.number().int().positive(),
	login: z.string().min(1).max(39),
	name: z.string().nullable(),
	bio: z.string().nullable(),
	avatar_url: z.url().startsWith("https://avatars.githubusercontent.com/"),
	html_url: z.url().startsWith("https://github.com/"),
	public_repos: z.number().int().nonnegative(),
	followers: z.number().int().nonnegative(),
	created_at: z.iso.datetime(),
});

export interface GitHubProfileSource {
	fetchAuthenticatedProfile(): Promise<GitHubProfile>;
}

export interface GitHubClientOptions {
	tokenProvider: GitHubTokenProvider;
	fetchFn?: typeof fetch;
	now?: () => Date;
	timeoutMs?: number;
}

function upstreamError(response: Response): AppError {
	if (response.status === 401) {
		return new AppError({
			status: 401,
			code: "GITHUB_AUTH_FAILED",
			safeMessage: "GitHub rejected the saved credential.",
		});
	}

	if (response.status === 403) {
		if (response.headers.get("x-ratelimit-remaining") === "0") {
			return new AppError({
				status: 429,
				code: "GITHUB_RATE_LIMITED",
				safeMessage: "GitHub rate limit reached. Please try again later.",
			});
		}

		return new AppError({
			status: 403,
			code: "GITHUB_FORBIDDEN",
			safeMessage: "GitHub denied access to the authenticated profile.",
		});
	}

	return new AppError({
		status: 502,
		code: "GITHUB_UNAVAILABLE",
		safeMessage: "GitHub profile data is temporarily unavailable.",
	});
}

function unavailable(cause?: unknown): AppError {
	return new AppError({
		status: 502,
		code: "GITHUB_UNAVAILABLE",
		safeMessage: "GitHub profile data is temporarily unavailable.",
		cause,
	});
}

export function createGitHubProfileClient({
	tokenProvider,
	fetchFn = fetch,
	now = () => new Date(),
	timeoutMs = 5000,
}: GitHubClientOptions): GitHubProfileSource {
	return {
		async fetchAuthenticatedProfile() {
			const token = await tokenProvider.getToken();
			if (!token) {
				throw new AppError({
					status: 503,
					code: "GITHUB_TOKEN_MISSING",
					safeMessage: "GitHub credential has not been saved yet.",
				});
			}

			let response: Response;
			try {
				response = await fetchFn("https://api.github.com/user", {
					headers: {
						Accept: "application/vnd.github+json",
						Authorization: `Bearer ${token}`,
						"User-Agent": "course-homework-github-profile",
						"X-GitHub-Api-Version": "2026-03-10",
					},
					signal: AbortSignal.timeout(timeoutMs),
				});
			} catch (error) {
				throw unavailable(error);
			}

			if (!response.ok) {
				throw upstreamError(response);
			}

			try {
				const upstream = upstreamProfileSchema.parse(await response.json());
				return githubProfileSchema.parse({
					githubId: upstream.id,
					login: upstream.login,
					displayName: upstream.name,
					bio: upstream.bio,
					avatarUrl: upstream.avatar_url,
					profileUrl: upstream.html_url,
					publicRepos: upstream.public_repos,
					followers: upstream.followers,
					githubCreatedAt: upstream.created_at,
					syncedAt: now().toISOString(),
				});
			} catch (error) {
				throw unavailable(error);
			}
		},
	};
}
