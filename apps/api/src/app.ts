import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { saveGitHubProfileInputSchema } from "./contracts/github-profile";
import type { ProfileRepository } from "./db/profile-repository";
import { AppError } from "./errors/app-error";
import type { GitHubProfileSource } from "./github/github-client";

export interface AppDependencies {
	github: GitHubProfileSource;
	profiles: ProfileRepository;
}

function validationError() {
	return new AppError({
		status: 400,
		code: "VALIDATION_FAILED",
		safeMessage: "The submitted profile fields are invalid.",
	});
}

function persistenceError(cause: unknown) {
	return new AppError({
		status: 500,
		code: "PERSISTENCE_FAILED",
		safeMessage: "The GitHub profile could not be persisted.",
		cause,
	});
}

export function createApp({ github, profiles }: AppDependencies) {
	const app = new Hono();

	app.onError((error, context) => {
		if (error instanceof AppError) {
			return context.json(
				error.toResponseBody(),
				error.status as ContentfulStatusCode,
			);
		}

		return context.json(
			{
				error: {
					code: "INTERNAL_ERROR",
					message: "The request could not be completed.",
				},
			},
			500,
		);
	});

	app.get("/health", (context) => context.json({ status: "ok" }));

	app.get("/api/github/me", async (context) => {
		return context.json(await github.fetchAuthenticatedProfile());
	});

	app.get("/api/github-profile", async (context) => {
		const profile = await profiles.findLatest().catch((error: unknown) => {
			throw persistenceError(error);
		});
		if (!profile) {
			throw new AppError({
				status: 404,
				code: "PROFILE_NOT_FOUND",
				safeMessage: "No GitHub profile has been saved yet.",
			});
		}
		return context.json(profile);
	});

	app.post("/api/github-profile", async (context) => {
		const body = await context.req.json().catch(() => undefined);
		const parsed = saveGitHubProfileInputSchema.safeParse(body);
		if (!parsed.success) {
			throw validationError();
		}

		const githubProfile = await github.fetchAuthenticatedProfile();
		const saved = await profiles
			.upsert({
				...githubProfile,
				displayName: parsed.data.displayName,
				bio: parsed.data.bio,
			})
			.catch((error: unknown) => {
				throw persistenceError(error);
			});
		return context.json(saved);
	});

	return app;
}

export type AppType = ReturnType<typeof createApp>;
