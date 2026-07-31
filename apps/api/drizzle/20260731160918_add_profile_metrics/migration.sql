ALTER TABLE `github_profiles` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `github_profiles` ADD `public_repos` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `github_profiles` ADD `followers` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_github_profiles` (
	`github_id` integer PRIMARY KEY,
	`login` text NOT NULL,
	`display_name` text,
	`location` text,
	`bio` text,
	`avatar_url` text NOT NULL,
	`profile_url` text NOT NULL,
	`public_repos` integer DEFAULT 0 NOT NULL,
	`followers` integer DEFAULT 0 NOT NULL,
	`github_created_at` text NOT NULL,
	`synced_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	CONSTRAINT "github_profiles_avatar_url_https_check" CHECK("avatar_url" like 'https://avatars.githubusercontent.com/%'),
	CONSTRAINT "github_profiles_profile_url_https_check" CHECK("profile_url" like 'https://github.com/%'),
	CONSTRAINT "github_profiles_public_repos_nonnegative_check" CHECK("public_repos" >= 0),
	CONSTRAINT "github_profiles_followers_nonnegative_check" CHECK("followers" >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_github_profiles`(`github_id`, `login`, `display_name`, `location`, `avatar_url`, `profile_url`, `github_created_at`, `created_at`, `updated_at`) SELECT `github_id`, `login`, `display_name`, `location`, `avatar_url`, `profile_url`, `github_created_at`, `created_at`, `updated_at` FROM `github_profiles`;--> statement-breakpoint
DROP TABLE `github_profiles`;--> statement-breakpoint
ALTER TABLE `__new_github_profiles` RENAME TO `github_profiles`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `github_profiles_login_unique` ON `github_profiles` (`login`);
