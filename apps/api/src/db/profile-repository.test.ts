import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { GitHubProfile } from "../contracts/github-profile";
import { createDatabase } from "./database";
import { createProfileRepository } from "./profile-repository";

const profile: GitHubProfile = {
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

async function applyMigrations(
	sqlite: ReturnType<typeof createDatabase>["sqlite"],
) {
	const root = path.resolve(import.meta.dirname, "../../drizzle");
	const directories = (await readdir(root, { withFileTypes: true }))
		.filter((entry) => entry.isDirectory() && /^\d{14}_/.test(entry.name))
		.map((entry) => entry.name)
		.toSorted();
	for (const directory of directories) {
		sqlite.exec(
			await readFile(path.join(root, directory, "migration.sql"), "utf8"),
		);
	}
}

describe("profile repository", () => {
	it("upserts one GitHub identity and returns the latest values", async () => {
		const database = createDatabase(":memory:");
		await applyMigrations(database.sqlite);
		const repository = createProfileRepository(
			database.db,
			() => new Date("2026-07-31T12:30:00.000Z"),
		);

		await repository.upsert(profile);
		await repository.upsert({ ...profile, bio: "Updated" });

		expect(await repository.findLatest()).toMatchObject({
			githubId: 42,
			bio: "Updated",
		});
		expect(
			database.sqlite
				.prepare("select count(*) as count from github_profiles")
				.get(),
		).toEqual({ count: 1 });
		database.close();
	});

	it("returns the identity that was just upserted when multiple rows exist", async () => {
		const database = createDatabase(":memory:");
		await applyMigrations(database.sqlite);
		const repository = createProfileRepository(database.db);
		await repository.upsert(profile);

		const second = await repository.upsert({
			...profile,
			githubId: 43,
			login: "another-user",
			profileUrl: "https://github.com/another-user",
		});

		expect(second.githubId).toBe(43);
		expect(second.login).toBe("another-user");
		database.close();
	});
});
