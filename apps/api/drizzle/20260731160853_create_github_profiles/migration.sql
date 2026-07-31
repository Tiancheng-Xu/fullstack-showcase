CREATE TABLE `github_profiles` (
	`github_id` integer PRIMARY KEY,
	`login` text NOT NULL,
	`display_name` text,
	`location` text,
	`avatar_url` text NOT NULL,
	`profile_url` text NOT NULL,
	`github_created_at` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	CONSTRAINT "github_profiles_avatar_url_https_check" CHECK("avatar_url" like 'https://avatars.githubusercontent.com/%'),
	CONSTRAINT "github_profiles_profile_url_https_check" CHECK("profile_url" like 'https://github.com/%')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_profiles_login_unique` ON `github_profiles` (`login`);