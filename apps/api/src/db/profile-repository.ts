import { desc, eq } from "drizzle-orm";
import type { GitHubProfile } from "../contracts/github-profile";
import type { AppDatabase } from "./database";
import { githubProfiles } from "./schema";

export interface ProfileRepository {
	findLatest(): Promise<GitHubProfile | null>;
	upsert(profile: GitHubProfile): Promise<GitHubProfile>;
}

function toProfile(row: typeof githubProfiles.$inferSelect): GitHubProfile {
	return {
		githubId: row.githubId,
		login: row.login,
		displayName: row.displayName,
		bio: row.bio,
		avatarUrl: row.avatarUrl,
		profileUrl: row.profileUrl,
		publicRepos: row.publicRepos,
		followers: row.followers,
		githubCreatedAt: row.githubCreatedAt,
		syncedAt: row.syncedAt,
	};
}

export function createProfileRepository(
	db: AppDatabase,
	now: () => Date = () => new Date(),
): ProfileRepository {
	return {
		async findLatest() {
			const [row] = await db
				.select()
				.from(githubProfiles)
				.orderBy(desc(githubProfiles.syncedAt))
				.limit(1);
			return row ? toProfile(row) : null;
		},

		async upsert(profile) {
			const timestamp = now().toISOString();
			const values = {
				...profile,
				createdAt: timestamp,
				updatedAt: timestamp,
			};
			await db
				.insert(githubProfiles)
				.values(values)
				.onConflictDoUpdate({
					target: githubProfiles.githubId,
					set: {
						login: profile.login,
						displayName: profile.displayName,
						bio: profile.bio,
						avatarUrl: profile.avatarUrl,
						profileUrl: profile.profileUrl,
						publicRepos: profile.publicRepos,
						followers: profile.followers,
						githubCreatedAt: profile.githubCreatedAt,
						syncedAt: profile.syncedAt,
						updatedAt: timestamp,
					},
				});

			const [saved] = await db
				.select()
				.from(githubProfiles)
				.where(eq(githubProfiles.githubId, profile.githubId))
				.limit(1);
			if (!saved) {
				throw new Error("Profile upsert did not return a row");
			}
			return toProfile(saved);
		},
	};
}
