import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { migrateDatabaseFile } from "./migration-runner";

const migrationsRoot = path.resolve(import.meta.dirname, "../../drizzle");

async function readMigration(directory: string) {
	return readFile(
		path.join(migrationsRoot, directory, "migration.sql"),
		"utf8",
	);
}

async function migrationDirectories() {
	return (await readdir(migrationsRoot, { withFileTypes: true }))
		.filter((entry) => entry.isDirectory() && /^\d{14}_/.test(entry.name))
		.map((entry) => entry.name)
		.toSorted();
}

describe("GitHub profile migration history", () => {
	it("adds metrics and removes location without losing old data", async () => {
		const sqlite = new DatabaseSync(":memory:");
		const directories = await migrationDirectories();
		expect(
			directories.map((directory) => directory.replace(/^\d{14}_/, "")),
		).toEqual([
			"create_github_profiles",
			"add_profile_metrics",
			"remove_location",
		]);
		for (const directory of directories) {
			expect(
				JSON.parse(
					await readFile(
						path.join(migrationsRoot, directory, "snapshot.json"),
						"utf8",
					),
				),
			).toBeTypeOf("object");
		}
		const [createMigration, ...remainingMigrations] = directories;
		if (!createMigration) {
			throw new Error("Initial migration is missing");
		}

		sqlite.exec(await readMigration(createMigration));
		sqlite
			.prepare(`
				insert into github_profiles (
					github_id, login, display_name, location, avatar_url,
					profile_url, github_created_at, created_at, updated_at
				) values (?, ?, ?, ?, ?, ?, ?, ?, ?)
			`)
			.run(
				42,
				"Tiancheng-Xu",
				"Tiancheng Xu",
				"New York",
				"https://avatars.githubusercontent.com/u/42?v=4",
				"https://github.com/Tiancheng-Xu",
				"2020-01-01T00:00:00Z",
				"2026-07-31T12:00:00.000Z",
				"2026-07-31T12:00:00.000Z",
			);

		for (const directory of remainingMigrations) {
			sqlite.exec(await readMigration(directory));
		}

		const columns = sqlite
			.prepare("pragma table_info(github_profiles)")
			.all()
			.map((column) => String(column.name));
		expect(columns).toEqual([
			"github_id",
			"login",
			"display_name",
			"bio",
			"avatar_url",
			"profile_url",
			"public_repos",
			"followers",
			"github_created_at",
			"synced_at",
			"created_at",
			"updated_at",
		]);
		expect(columns).not.toContain("location");
		expect(
			sqlite
				.prepare("select github_id, login, display_name from github_profiles")
				.get(),
		).toEqual({
			github_id: 42,
			login: "Tiancheng-Xu",
			display_name: "Tiancheng Xu",
		});

		expect(() =>
			sqlite
				.prepare(
					"update github_profiles set public_repos = -1 where github_id = 42",
				)
				.run(),
		).toThrow();
		expect(() =>
			sqlite
				.prepare(`
					insert into github_profiles (
						github_id, login, avatar_url, profile_url, github_created_at
					) values (?, ?, ?, ?, ?)
				`)
				.run(
					43,
					"Tiancheng-Xu",
					"https://avatars.githubusercontent.com/u/43?v=4",
					"https://github.com/another-user",
					"2021-01-01T00:00:00Z",
				),
		).toThrow();
	});

	it("creates a new database directory before applying migrations", async () => {
		const temporaryDirectory = await mkdtemp(
			path.join(tmpdir(), "github-profile-migration-"),
		);
		const databasePath = path.join(temporaryDirectory, "nested/profile.sqlite");
		try {
			migrateDatabaseFile(databasePath, migrationsRoot);
			const sqlite = new DatabaseSync(databasePath);
			expect(
				sqlite
					.prepare(
						"select name from sqlite_master where type = 'table' and name = 'github_profiles'",
					)
					.get(),
			).toEqual({ name: "github_profiles" });
			sqlite.close();
		} finally {
			await rm(temporaryDirectory, { recursive: true, force: true });
		}
	});
});
