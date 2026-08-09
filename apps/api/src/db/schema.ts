import { sql } from "drizzle-orm";
import {
	check,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const githubProfiles = sqliteTable(
	"github_profiles",
	{
		githubId: integer("github_id").primaryKey(),
		login: text("login").notNull(),
		displayName: text("display_name"),
		bio: text("bio"),
		avatarUrl: text("avatar_url").notNull(),
		profileUrl: text("profile_url").notNull(),
		publicRepos: integer("public_repos").notNull().default(0),
		followers: integer("followers").notNull().default(0),
		githubCreatedAt: text("github_created_at").notNull(),
		syncedAt: text("synced_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
		createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => [
		uniqueIndex("github_profiles_login_unique").on(table.login),
		check(
			"github_profiles_avatar_url_https_check",
			sql`${table.avatarUrl} like 'https://avatars.githubusercontent.com/%'`,
		),
		check(
			"github_profiles_profile_url_https_check",
			sql`${table.profileUrl} like 'https://github.com/%'`,
		),
		check(
			"github_profiles_public_repos_nonnegative_check",
			sql`${table.publicRepos} >= 0`,
		),
		check(
			"github_profiles_followers_nonnegative_check",
			sql`${table.followers} >= 0`,
		),
	],
);
