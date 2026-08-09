import { migrate } from "drizzle-orm/node-sqlite/migrator";
import { type AppDatabase, createDatabase } from "./database";

export function applyMigrations(db: AppDatabase, migrationsFolder: string) {
	const result = migrate(db, { migrationsFolder });
	if (result && "error" in result) {
		throw result.error;
	}
}

export function migrateDatabaseFile(
	databasePath: string,
	migrationsFolder: string,
) {
	const database = createDatabase(databasePath);
	try {
		applyMigrations(database.db, migrationsFolder);
	} finally {
		database.close();
	}
}
