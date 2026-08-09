import { z } from "zod";

const nullableTrimmed = (max: number) => z.string().trim().max(max).nullable();

export const githubProfileSchema = z
	.object({
		githubId: z.number().int().positive(),
		login: z.string().min(1).max(39),
		displayName: nullableTrimmed(100),
		bio: nullableTrimmed(500),
		avatarUrl: z.url().startsWith("https://avatars.githubusercontent.com/"),
		profileUrl: z.url().startsWith("https://github.com/"),
		publicRepos: z.number().int().nonnegative(),
		followers: z.number().int().nonnegative(),
		githubCreatedAt: z.iso.datetime(),
		syncedAt: z.iso.datetime(),
	})
	.strict();

export const saveGitHubProfileInputSchema = z
	.object({
		displayName: nullableTrimmed(100),
		bio: nullableTrimmed(500),
	})
	.strict();

export const apiErrorBodySchema = z.object({
	error: z.object({
		code: z.string().min(1),
		message: z.string().min(1),
	}),
});

export type GitHubProfile = z.infer<typeof githubProfileSchema>;
export type SaveGitHubProfileInput = z.infer<
	typeof saveGitHubProfileInputSchema
>;
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;
